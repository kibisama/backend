// const { cardinal } = require("../../api/puppet");
// const {
//   handleResults,
//   getDate,
// } = require("../../services/cah/upsertItemsViaDSCSA");

// module.exports = async (req, res, next) => {
//   try {
//     const body = req.body;
//     const result = await cardinal.getDSCSAData(body);
//     if (result instanceof Error) {
//       if (result.status === 503) {
//         return res.sendStatus(503);
//       }
//     } else {
//       const number = await handleResults(
//         result.data.results,
//         getDate(body.date)
//       );
//       console.log(number);
//       return res.sendStatus(200);
//     }
//     return res.sendStatus(500);
//   } catch (e) {
//     console.log(e);
//   }
// };
