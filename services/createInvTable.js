// const dayjs = require("dayjs");
// /**
//  * @param {[Object]} data
//  * @returns {[Object]}
//  */
// const createInvTable = (data) => {
//   const gtins = new Set();
//   data.forEach((v) => {
//     gtins.add(v.gtin);
//   });
//   const result = [];
//   gtins.forEach((gtin) => {
//     const table = {
//       label: gtin,
//       rows: data
//         .filter((v) => v.gtin === gtin)
//         .map((v) => {
//           return {
//             sn: v.sn,
//             lot: v.lot,
//             exp: dayjs(v.exp).format("MM-DD-YYYY"),
//             dateReceived: v.dateReceived
//               ? dayjs(v.dateReceived).format("MM-DD-YYYY")
//               : undefined,
//             source: v.source,
//             dateFilled: v.dateFilled,
//             dateReversed: v.dateReversed,
//             dateRetuned: v.dateRetuned,
//           };
//         }),
//     };
//     result.push(table);
//   });
//   return result;
// };

// module.exports = createInvTable;
