const dlvry = require("../../services/apps/delivery");

exports.get = async (req, res) => {
  try {
    const stations = await dlvry.getAllDeliveryStations();
    return res
      .status(200)
      .send({ code: 200, data: stations.map((v) => v.displayName) });
  } catch (e) {
    console.error(e);
  }
};

exports.getAllStations = async (req, res) => {
  try {
    return res
      .status(200)
      .send({ code: 200, data: await dlvry.getAllDeliveryStations() });
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
