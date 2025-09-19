const dlvry = require("../services/apps/delivery");
const dRx = require("../services/dRx/dRx");

exports.get = async (req, res) => {
  try {
    return res
      .status(200)
      .send({ code: 200, data: await dlvry.getAllDeliveryStations() });
  } catch (e) {
    console.error(e);
  }
};

exports.getStationId = (req, res, next) => {
  const { section } = req.params;
  const stationId = dlvry.getDeliveryStationId(section, "displayName");
  if (stationId) {
    res.locals.stationId = stationId;
    return next();
  }
  return res.status(404).send({ code: 404, message: "Not Found" });
};

exports.getSessions = async (req, res) => {
  try {
    const { date } = req.params;
    const stationId = res.locals.stationId;
    const logs = await dlvry.findDeliveryLog(date, stationId);
    return res
      .status(200)
      .send({ code: 200, data: logs.map((v) => v.session) });
  } catch (e) {
    console.error(e);
  }
};

exports.getLogs = async (req, res) => {
  const { date, session } = req.params;
  const stationId = res.locals.stationId;
  let data;
  let deliveryLog;
  try {
    if (session !== "0") {
      // deliveryLog = await
    }
    data = await dRx.findDRxByStationId(stationId, date);
    if (data.length === 0) {
      return res.status(404).send({ code: 404, message: "Not Found" });
    }
    return res
      .status(200)
      .send({ code: 200, data: await dRx.mapDeliveryLogs(data) });
  } catch (e) {
    console.error(e);
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
