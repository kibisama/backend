const dlvry = require("../services/apps/delivery");
const dRx = require("../services/dRx/dRx");

exports.get = async (req, res, next) => {
  try {
    return res
      .status(200)
      .send({ code: 200, data: await dlvry.getAllDeliveryStations() });
  } catch (e) {
    console.error(e);
    next(e);
  }
};

exports.getStation = (req, res, next) => {
  const { section } = req.params;
  const station = dlvry.getDeliveryStation(section.toUpperCase());
  if (station) {
    res.locals.station = station;
    return next();
  }
  return res.status(404).send({ code: 404, message: "Not Found" });
};

exports.getStationInfo = (req, res) => {
  return res.status(200).send({ code: 200, data: res.locals.station });
};

exports.getSessions = async (req, res, next) => {
  try {
    const { date } = req.params;
    const { _id } = res.locals.station;
    const data = await dlvry.findDeliverySessions(date, _id);
    if (!data) {
      return res.status(500).send({ code: 500 });
    }
    return res.status(200).send({ code: 200, data });
  } catch (e) {
    console.error(e);
    next(e);
  }
};

exports.getLogItems = async (req, res, next) => {
  const { date, session } = req.params;
  const { _id } = res.locals.station;
  try {
    const data = await dlvry.findDeliveryLogItems(date, _id, session);
    if (data.length === 0) {
      return res.status(404).send({ code: 404, message: "Not Found" });
    }
    return res.status(200).send({ code: 200, data });
  } catch (e) {
    console.error(e);
    next(e);
  }
};

const RECEIPT_COUNT_PER_PAGE = 40;
exports.getReceipt = async (req, res, next) => {
  const { date, session } = req.params;
  const { _id, name, address, city, state, zip, phone, invoiceCode } =
    res.locals.station;
  try {
    const log = await dlvry.findDeliveryLog(date, _id, session);
    if (log === null) {
      return res.status(404).send({ code: 404, message: "Not Found" });
    }
    const count = log.dRxes.length;
    const items = [];
    const dRxes = await dlvry.mapDeliveryLogs(log.dRxes);
    const pages = Math.ceil(count / RECEIPT_COUNT_PER_PAGE);
    for (let i = 0; i < pages; i++) {
      items.push(dRxes.splice(0, RECEIPT_COUNT_PER_PAGE));
    }
    return res.status(200).send({
      code: 200,
      data: {
        pages: pages.toString(),
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
      },
    });
  } catch (e) {
    console.error(e);
    next(e);
  }
};

exports.postLog = async (req, res, next) => {
  try {
    const { _id } = res.locals.station;
    const data = await dlvry.createDeliveryLog(_id);
    if (!data) {
      return res
        .status(500)
        .send({ code: 500, message: "Internal Server Error" });
    }
    return res.status(200).send({ code: 200, data });
  } catch (e) {
    console.error(e);
    next(e);
  }
};

exports.scanQR = async (req, res, next) => {
  try {
    const { _id } = res.locals.station;
    const { data, delimiter } = req.body;
    const a = data?.split(delimiter || "|").map((v) => v.trim());
    if (a?.length !== 12 || !a[0].match(/^\d{8,}$/)) {
      return res.status(400).send({ code: 400, message: "Bad Request" });
    }
    const _dRx = await dRx.upsertDRx({ rxID: a[0] });
    const { deliveryLog, deliveryStation } = _dRx;
    if (deliveryLog) {
      return res.status(409).send({
        code: 409,
        message: "Unable to update because the Rx has already been delivered.",
      });
    }
    let exStation;
    deliveryStation && (exStation = deliveryStation);
    const result = await dRx.upsertWithQR(a, _id, new Date());
    if (!result) {
      return res.status(500).send({
        code: 500,
        message: "An unexpected error occurred. Please try again.",
      });
    }
    if (exStation && !_id.equals(exStation)) {
      dlvry.setDeliveryStagesToday(exStation);
    }
    dlvry.setDeliveryStagesToday(_id);
    return res.status(200).send({ code: 200, data: result });
  } catch (e) {
    console.error(e);
    next(e);
  }
};

exports.unsetDeliveryStation = async (req, res, next) => {
  try {
    const { rxID } = req.params;
    if (!rxID) {
      return res.status(400).send({ code: 400, message: "Bad Request" });
    }
    const _dRx = await dRx.findDRxByRxID(rxID);
    if (!_dRx) {
      return res.status(404).send({ code: 404, message: "Not Found" });
    } else if (_dRx.deliveryLog) {
      return res.status(409).send({
        code: 409,
        message: "Unable to update because the Rx has already been delivered.",
      });
    }
    const { deliveryStation } = _dRx;
    if (deliveryStation) {
      await _dRx.updateOne({ $unset: { deliveryStation: 1, deliveryDate: 1 } });
      dlvry.setDeliveryStagesToday(deliveryStation);
    }
    return res.status(200).send({ code: 200 });
  } catch (e) {
    console.error(e);
    next(e);
  }
};

// exports.post = async (req, res, next) => {
//   const { method } = req.body;
//   const { name } = req.params;
//   try {
//     switch (method) {
//       case "CREATE":
//         const exGroup = await fg.findFacilityGroup({ name });
//         if (exGroup) {
//           return res.sendStatus();
//         }
//         await fg.createFacilityGroup(name);
//         break;
//       case "UPDATE":
//         break;
//       case "ADD":
//         break;
//       case "PULL":
//         break;
//     }
//     return res.sendStatus(200);
//   } catch (e) {
//     console.error(e);
//     next(e);
//   }
// };
