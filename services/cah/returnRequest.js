const dayjs = require("dayjs");
// const { scheduleJob } = require("node-schedule");
const item = require("../inv/item");
// const package = require("../inv/package");
// const nodeMailer = require("../nodeMailer");
// const { getSettings } = require("../apps/settings");
const common = require("../common");

/**
 * @param {Item} item
 * @returns {common.Response}
 */
exports.checkItemCondition = (item) => {
  const { dateReceived, exp } = item;
  const today = dayjs();
  const dayExp = dayjs(exp, "YYMMDD");
  if (dayExp.isBefore(today.add(200, "day"))) {
    return {
      code: 409,
      message: "The expiration date is too short (less than 200 days).",
    };
  }
  const dayDateReceived = dayjs(dateReceived);
  if (dayDateReceived.isAfter(today.add(1, "year"))) {
    return {
      code: 409,
      message:
        "Cardinal does not accept returning items passed more than 1 year.",
    };
  } else if (dayDateReceived.isAfter(today.add(350, "days"))) {
    return {
      code: 202,
      message:
        "The item has passed more than 350 days. Cardinal might not issue RMA.",
    };
  } else if (dayDateReceived.isAfter(today.add(180, "day"))) {
    return {
      code: 202,
      message:
        "The item has passed more than 180 days. Cardinal will not issue the full credit.",
    };
  } else if (dayDateReceived.isAfter(today.add(170, "day"))) {
    return {
      code: 202,
      message:
        "The item has passed more than 170 days. Cardinal might not issue the full credit.",
    };
  } else {
    return { code: 200 };
  }
};

/**
 * @typedef {object} ReturnItem
 * @property {string} gtin
 * @property {string} sn
 * @property {string} [invoiceRef]
 * @property {string} [cost]
 * @property {string} [cin]
 * @property {string} [ndc]
 * @typedef {item.Item} Item
 */

// /**
//  * @returns {Promise<[Item]|undefined>}
//  */
// const findReturnedItems = async () => {
//   try {
//     return await item.findReturnedItems(dayjs(), "CARDINAL");
//   } catch (e) {
//     console.error(e);
//   }
// };

// /**
//  * @param {[Item]} items
//  * @returns {Promise<[{}]|undefined>}
//  */
// const mapItems = async (items) => {
//   try {
//     const table = {};
//     items.forEach(async (v) => {
//       const { gtin } = v;
//       if (!table[gtin]) {
//         try {
//           const _package = await (
//             await package.findPackage(gtin, "gtin")
//           ).populate({ path: "cahProduct", select: "cin" });
//           table[gtin] = {};
//           table[gtin].ndc = _package.ndc11 || "";
//           table[gtin].cin = _package.cahProduct.cin || "";
//         } catch (e) {
//           console.error(e);
//         }
//       }
//     });
//     return items.map((v) => {
//       return {
//         invoiceRef: v.invoiceRef,
//         cin: table[v.gtin].ndc,
//         ndc: table[v.gtin].cin,
//         sn: v.sn,
//       };
//     });
//   } catch (e) {
//     console.error(e);
//   }
// };

// /**
//  * @returns {Promise<undefined>}
//  */
// const processReturns = async () => {
//   if (common.isStoreOpen()) {
//     try {
//       const items = await findReturnedItems();
//       if (items.length > 0) {
//         const _items = await mapItems(items);
//         mailReport(_items);
//       }
//     } catch (e) {
//       console.error(e);
//     }
//   }
//   scheduleJob(getNextScheduleDate(), processReturns);
// };

// /**
//  * @returns {dayjs.Dayjs}
//  */
// const getNextScheduleDate = () => {
//   return dayjs()
//     .add(1, "day")
//     .set("hour", 23)
//     .set("minute", 55)
//     .set("second", 0)
//     .toDate();
// };

// /**
//  * @returns {dayjs.Dayjs}
//  */
// const getScheduleDate = () => {
//   return dayjs().set("hour", 23).set("minute", 55).set("second", 0).toDate();
// };

// /**
//  * @returns {undefined}
//  */
// exports.scheduleMailer = () => {
//   scheduleJob(getScheduleDate(), processReturns);
// };

// /**
//  * @param {[ReturnItem]} items
//  * @returns {Promise<undefined>}
//  */
// const mailReport = async (items) => {
//   try {
//     const {
//       storeName,
//       storeAddress,
//       storeCity,
//       storeState,
//       storeZip,
//       storePhone,
//       storeFax,
//       storeEmail,
//     } = await getSettings();
//     nodeMailer.sendMail(
//       {
//         from: process.env.MAILER_EMAIL,
//         to: process.env.MAILER_EMAIL,
//         subject: "RMA request",
//         html: `
//         <div>
//           <p>
//             Account Name: ${process.env.CARDINAL_ACCOUNT_NAME}
//             <br/>
//             Account Number: ${process.env.CARDINAL_ACCOUNT_NUMBER}
//             <br/>
//             Contact Information:
//             <br/>
//             ${storeName}
//             <br/>
//             ${storeAddress}
//             <br/>
//             ${storeCity}, ${storeState} ${storeZip}
//             <br/>
//             Phone ${storePhone}
//             <br/>
//             Fax ${storeFax}
//             <br/>
//             Email ${storeEmail}
//           </p>
//           <br/>
//           <p>Please create MRA for the following item(s).</p>
//           <br/>
//         ${generateHtmlTable(items)}
//         </div>
//         `,
//       },
//       (err, info) => {
//         if (err) {
//           console.error(err);
//         }
//       }
//     );
//   } catch (e) {
//     console.error(e);
//   }
// };

// /**
//  * @param {[ReturnItem]} items
//  * @returns {string}
//  */
// const generateHtmlTable = (items) => {
//   return `
//               <div>
//                 <table>
//                   <thead>
//                     <tr>
//                       <th>#</th>
//                       <th>Invoice #</th>
//                       <th>CIN/NDC</th>
//                       <th>GTIN</th>
//                       <th>Serial #</th>
//                       <th>Reason</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     ${items
//                       .map(
//                         (v, i) => `
//                     <tr>
//                       <td>${(i + 1).toString()}</td>
//                       <td>${v.invoiceRef || ""}</td>
//                       <td>${v.cin || v.ndc}</td>
//                       <td>${v.gtin}</td>
//                       <td>${v.sn}</td>
//                       <td>Overstock</td>
//                     </tr>
//                     `
//                       )
//                       .join("")}
//                   </tbody>
//                 </table>
//               </div>
//               `;
// };
