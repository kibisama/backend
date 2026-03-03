const dayjs = require("dayjs");

const sendToQueue = require("../rabbitmq");
const queue_delivery_new = "delivery_new";
const queue_delivery_ship = "delivery_ship";
const queue_delivery_cancel = "delivery_cancel";
const queue_station_new = "station_new";
const queue_station_update = "station_update";

const delivery = require("../services/delivery");
const dRx = require("../services/dRx/dRx");

exports.getAllDeliveryStations = async (req, res, next) => {
  try {
    const stations = await delivery.findAllDeliveryStations();
    return res.send(stations.map((station, i) => ({ ...station, id: i })));
  } catch (error) {
    next(error);
  }
};

exports.getActiveDeliveryStations = async (req, res, next) => {
  try {
    return res.send(delivery.getActiveDeliveryStations());
  } catch (error) {
    next(error);
  }
};

exports.getStation = (req, res, next) => {
  const { invoiceCode } = req.params;
  try {
    const s = delivery.getDeliveryStation(invoiceCode.toUpperCase());
    if (!s) {
      return res.sendStatus(404);
    }
    res.locals.station = s;
    return next();
  } catch (error) {
    next(error);
  }
};

exports.postStation = async (req, res, next) => {
  try {
    const station = await delivery.createDeliveryStation(req.body);
    const msgContent = JSON.stringify({
      code: station.invoiceCode,
      name: station.name,
      address: station.address,
      city: station.city,
      state: station.state,
      zip: station.zip,
      phone: station.phone,
    });
    await sendToQueue(queue_station_new, msgContent);
    return res.sendStatus(200);
  } catch (error) {
    next(error);
  }
};

exports.putStation = async (req, res, next) => {
  const _station = res.locals.station;
  try {
    const station = await delivery.updateDeliveryStation(_station, req.body);
    const msgContent = JSON.stringify({
      code: station.invoiceCode,
      name: station.name,
      address: station.address,
      city: station.city,
      state: station.state,
      zip: station.zip,
      phone: station.phone,
      active: station.active,
    });
    await sendToQueue(queue_station_update, msgContent);
    return res.sendStatus(200);
  } catch (error) {
    next(error);
  }
};

exports.getStationInfo = (req, res) => res.send(res.locals.station);

exports.getSessions = async (req, res, next) => {
  try {
    const { date } = req.params;
    const { _id } = res.locals.station;
    const data = await delivery.findDeliverySessions(date, _id);
    if (data.length === 0) {
      return res.sendStatus(404);
    }
    return res.send(data);
  } catch (error) {
    next(error);
  }
};

exports.scanQR = async (req, res, next) => {
  const station = res.locals.station;
  const { data, delimiter } = req.body;
  try {
    const qr = dRx.decodeQR(data, delimiter);
    const exDRx = await dRx.findDRxByRxID(qr.dRxSchema.rxID);
    let exStation;
    if (exDRx) {
      const { deliveryLog, deliveryStation } = exDRx;
      if (deliveryLog) {
        return res
          .status(422)
          .send("Unable to update because the Rx has already been delivered.");
      }
      exStation = deliveryStation;
    }
    const upserted = await dRx.upsertDRx(qr);
    const deliveryDate = new Date();
    await dRx.setDelivery(upserted, station, deliveryDate);
    if (exStation && !station._id.equals(exStation._id)) {
      await delivery.refresh_nodeCache_delivery_stages(exStation._id);
    }
    await delivery.refresh_nodeCache_delivery_stages(station._id);
    res.sendStatus(200);
    const msgContent = JSON.stringify({
      stationCode: station.invoiceCode,
      date: deliveryDate,
      data,
      delimiter,
    });
    await sendToQueue(queue_delivery_new, msgContent);
  } catch (error) {
    next(error);
  }
};

exports.unsetDeliveryStation = async (req, res, next) => {
  try {
    const { rxID } = req.params;
    const _dRx = await dRx.findDRxByRxID(rxID);
    if (!_dRx) {
      return res.sendStatus(404);
    }
    const { deliveryDate, deliveryStation } = _dRx;
    if (deliveryDate || deliveryStation) {
      await dRx.unsetDelivery(_dRx);
      if (deliveryDate) {
        deliveryStation &&
          dayjs(deliveryDate).isSame(dayjs(), "d") &&
          (await delivery.refresh_nodeCache_delivery_stages(
            deliveryStation._id,
          ));
        const msgContent = JSON.stringify({
          rxID,
          date: deliveryDate,
        });
        await sendToQueue(queue_delivery_cancel, msgContent);
      }
    }
    return res.sendStatus(200);
  } catch (error) {
    next(error);
  }
};

exports.returnDelivery = async (req, res, next) => {
  try {
    const { rxID } = req.params;
    const _dRx = await dRx.findDRxByRxID(rxID);
    if (!_dRx) {
      return res.sendStatus(404);
    }
    const { deliveryStation, deliveryDate, deliveryLog } = _dRx;
    await dRx.returnDelivery(_dRx);
    if (deliveryStation && deliveryDate) {
      dayjs(deliveryDate).isSame(dayjs(), "d") &&
        (await delivery.refresh_nodeCache_delivery_today_sessions(
          deliveryStation.invoiceCode,
          deliveryLog.session,
        ));
      const msgContent = JSON.stringify({
        rxID,
        stationCode: deliveryStation.invoiceCode,
        date: deliveryDate,
      });
      await sendToQueue(queue_delivery_cancel, msgContent);
    }
    return res.sendStatus(200);
  } catch (error) {
    next(error);
  }
};

exports.findDeliveries = async (req, res, next) => {
  const { date, session } = req.params;
  const station = res.locals.station;
  try {
    const dRxes = await delivery.findDeliveries(date, station, session);
    if (dRxes.length === 0) {
      return res.sendStatus(404);
    }
    return res.send(delivery.deliveryRows(dRxes));
  } catch (error) {
    next(error);
  }
};

exports.postLog = async (req, res, next) => {
  try {
    const station = res.locals.station;
    const log = await delivery.createDeliveryLog(station);
    const msgContent = JSON.stringify({
      stationCode: station.invoiceCode,
      date: log.createdAt,
      rxIDs: log.dRxes.map((dRx) => dRx.rxID),
    });
    await sendToQueue(queue_delivery_ship, msgContent);
    return res.send({ date: log.date, session: log.session });
  } catch (error) {
    next(error);
  }
};

exports.getReceipt = async (req, res, next) => {
  const { date, session } = req.params;
  const { _id, name, address, city, state, zip, phone, invoiceCode } =
    res.locals.station;
  try {
    const log = await delivery.findDeliveryLog(date, _id, session);
    const items = delivery.deliveryRows(log.dRxes);
    const count = log.dRxes.length;
    return res.send({
      count: count.toString(),
      due: log.due,
      date,
      session,
      station: {
        name,
        address1: address,
        address2: `${city}, ${state} ${zip}`,
        phone,
        code: invoiceCode,
      },
      items,
    });
  } catch (error) {
    next(error);
  }
};

exports.search = async (req, res, next) => {
  try {
    const { rxNumber, patient } = req.query;
    const result = await dRx.searchDRxWithRxNumberOrPatient(rxNumber, patient);
    if (result.length === 0) {
      return res.sendStatus(404);
    }
    return res.send(delivery.searchResultRows(result));
  } catch (error) {
    next(error);
  }
};
