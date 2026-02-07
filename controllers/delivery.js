// const dlvry = require("../services/apps/delivery");

const sendToQueue = require("../rabbitmq");

const delivery = require("../services/delivery");
const dRx = require("../services/dRx/dRx");

exports.getActiveDeliveryStations = async (req, res, next) => {
  try {
    return res.send(delivery.getActiveDeliveryStations());
  } catch (error) {
    next(error);
  }
};

exports.getStation = (req, res, next) => {
  const { invoiceCode } = req.params;
  const s = delivery.getDeliveryStation(invoiceCode.toUpperCase());
  if (s) {
    res.locals.station = s;
    return next();
  }
  return res.sendStatus(404);
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

const queue_delivery_new = "delivery_new";
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
    if (exStation && !station._id.equals(exStation)) {
      await delivery.refresh_nodeCache_delivery_stages(exStation);
    }
    await delivery.refresh_nodeCache_delivery_stages(station._id);
    res.sendStatus(200);
    // Todo: Outbox
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

exports.getLogItems = async (req, res, next) => {
  const { date, session } = req.params;
  const station = res.locals.station;
  try {
    if (session === "0") {
      return res.send(delivery.getDeliveriesOnStage(station._id));
    }
    // const data = await dlvry.findDeliveryLogItems(date, _id, session);
    // if (!data) {
    //   return res
    //     .status(500)
    //     .send({ code: 500, message: "Internal Server Error" });
    // }
    // if (data.length === 0) {
    //   return res.status(404).send({ code: 404, message: "Not Found" });
    // }
    // return res.status(200).send({ code: 200, data });
  } catch (error) {
    next(error);
  }
};

// const RECEIPT_COUNT_PER_PAGE = 40;
// exports.getReceipt = async (req, res, next) => {
//   const { date, session } = req.params;
//   const { _id, name, address, city, state, zip, phone, invoiceCode } =
//     res.locals.station;
//   try {
//     const log = await dlvry.findDeliveryLog(date, _id, session);
//     if (log === null) {
//       return res.status(404).send({ code: 404, message: "Not Found" });
//     }
//     const count = log.dRxes.length;
//     const items = [];
//     const dRxes = await dlvry.mapDeliveryLogs(log.dRxes);
//     const pages = Math.ceil(count / RECEIPT_COUNT_PER_PAGE);
//     for (let i = 0; i < pages; i++) {
//       items.push(dRxes.splice(0, RECEIPT_COUNT_PER_PAGE));
//     }
//     return res.status(200).send({
//       code: 200,
//       data: {
//         pages: pages.toString(),
//         count: count.toString(),
//         due: log.due,
//         date,
//         session,
//         station: {
//           name,
//           address1: address,
//           address2: `${city}, ${state} ${zip}`,
//           phone,
//           code: invoiceCode,
//         },
//         items,
//       },
//     });
//   } catch (e) {
//     console.error(e);
//     next(e);
//   }
// };

// exports.postLog = async (req, res, next) => {
//   try {
//     const { _id } = res.locals.station;
//     const data = await dlvry.createDeliveryLog(_id);
//     if (!data) {
//       return res
//         .status(500)
//         .send({ code: 500, message: "Internal Server Error" });
//     }
//     return res.status(200).send({ code: 200, data });
//   } catch (e) {
//     console.error(e);
//     next(e);
//   }
// };

// exports.unsetDeliveryStation = async (req, res, next) => {
//   try {
//     const { rxID } = req.params;
//     if (!rxID) {
//       return res.status(400).send({ code: 400, message: "Bad Request" });
//     }
//     const _dRx = await dRx.findDRxByRxID(rxID);
//     if (!_dRx) {
//       return res.status(404).send({ code: 404, message: "Not Found" });
//     } else if (_dRx.deliveryLog) {
//       return res.status(409).send({
//         code: 409,
//         message: "Unable to update because the Rx has already been delivered.",
//       });
//     }
//     const { deliveryStation } = _dRx;
//     if (deliveryStation) {
//       await _dRx.updateOne({ $unset: { deliveryStation: 1, deliveryDate: 1 } });
//       await _dRx.populate("deliveryStation");
//       dlvry.setDeliveryStagesToday(deliveryStation);
//       await refresh_cache_delivery(_dRx.deliveryStation.invoiceCode);
//     }
//     return res.status(200).send({ code: 200 });
//   } catch (e) {
//     console.error(e);
//     next(e);
//   }
// };

// exports.reverseDelivery = async (req, res, next) => {
//   try {
//     const { rxID } = req.params;
//     if (!rxID) {
//       return res.status(400).send({ code: 400, message: "Bad Request" });
//     }
//     const result = await dRx.setReturn(rxID);
//     if (result === null) {
//       return res.status(404).send({ code: 404, message: "Not Found" });
//     } else if (!result) {
//       return res
//         .status(500)
//         .send({ code: 500, message: "Internal Server Error" });
//     }
//     return res
//       .status(200)
//       .send({ code: 200, data: (await dlvry.mapSearchResults([result]))[0] });
//   } catch (e) {
//     console.error(e);
//   }
// };

// exports.search = async (req, res, next) => {
//   try {
//     const { rxNumber, patient } = req.query;
//     if (!(rxNumber || patient)) {
//       return res.status(400).send({ code: 400, message: "Bad Request" });
//     }
//     const _data = await dRx.findDRxForDeliveries(rxNumber, patient);
//     if (_data.length === 0) {
//       return res.status(404).send({ code: 404, message: "Not Found" });
//     }
//     const data = await dlvry.mapSearchResults(_data);
//     return res.status(200).send({ code: 200, data });
//   } catch (e) {
//     console.error(e);
//     next(e);
//   }
// };

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
