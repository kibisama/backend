const dayjs = require("dayjs");
const customParseFormat = require("dayjs/plugin/customParseFormat");
dayjs.extend(customParseFormat);
const Item = require("../../schemas/item");
const { checkDateReceived } = require("../cah/returnRequest");

/**
 * @typedef {Item.Item} Item
 * @typedef {Item.Method} Method
 * @typedef {Item.Source} Source
 * @typedef {object} DataMatrix
 * @property {string} gtin
 * @property {string} lot
 * @property {string} sn
 * @property {string} exp
 * @typedef {"RECEIVE"|"FILL"|"REVERSE"|"RETURN"} Mode
 * @typedef {object} ScanReqProp
 * @property {Mode} mode
 * @property {Source} [source]
 * @property {string} [cost]
 * @typedef {DataMatrix & ScanReqProp} ScanReq
 */

/**
 * @param {DataMatrix} dm
 * @returns {{gtin: string, sn: string}}
 */
const createFilter = (dm) => {
  const { gtin, sn } = dm;
  return { gtin, sn };
};
/**
 * Converts exp string to a native Date object.
 * @param {string} exp
 * @returns {Date}
 */
const convertExpToDate = (exp) => {
  return dayjs(exp, "YYMMDD").toDate();
};

/**
 * Upserts an Item document.
 * @param {DataMatrix} dm
 * @param {Method} method
 * @param {string} invoiceRef optional
 * @returns {Promise<Item|undefined>}
 */
exports.upsertItem = async (dm, method, invoiceRef) => {
  try {
    return await Item.findOneAndUpdate(
      createFilter(dm),
      { lot: dm.lot, exp: convertExpToDate(dm.exp), method, invoiceRef },
      { new: true, upsert: true }
    );
  } catch (e) {
    console.error(e);
  }
};

/**
 * Updates an Item document.
 * @param {ScanReq} scanReq
 * @param {Date} [date]
 * @returns {Promise<Item|undefined>}
 */
exports.updateItem = async (scanReq, date) => {
  try {
    const { mode, source, cost } = scanReq;
    const now = date instanceof Date ? date : new Date();
    /** @type {Parameters<Item["findOneAndUpdate"]>["1"]} */
    const update = {};
    switch (mode) {
      case "RECEIVE":
        update.$set = { dateReceived: now, source, cost };
        break;
      case "FILL":
        update.$set = { dateFilled: now };
        break;
      case "REVERSE":
        update.$set = { dateReversed: now };
        update.$unset = { dateFilled: 1 };
        break;
      case "RETURN":
        update.$set = { dateReturned: now };
        update.$unset = { dateFilled: 1 };
        break;
      default:
    }
    return await Item.findOneAndUpdate(createFilter(scanReq), update, {
      new: true,
    });
  } catch (e) {
    console.error(e);
  }
};

// /**
//  * Check if the scan is a new fill.
//  * @param {Item} item
//  * @param {Mode} mode
//  * @returns {boolean}
//  */
// exports.isNewFill = (item, mode) => {
//   if (mode === "FILL" && !item.dateFilled) {
//     return true;
//   }
//   return false;
// };
// /**
//  * @param {Item} item
//  * @returns {import("../common").Response}
//  */
// exports.preprocessReturn = (item) => {
//   try {
//     const { dateFilled, dateReceived, exp, source } = item;
//     if (dayjs().isAfter(dayjs(exp))) {
//       return { code: 409, message: "The item is already expired." };
//     } else if (dateFilled) {
//       return { code: 409, message: "The item is already filled." };
//     } else if (!dateReceived) {
//       return {
//         code: 409,
//         message: "The date received for the item has not recorded.",
//       };
//     } else {
//       switch (source) {
//         case "CARDINAL":
//           return checkDateReceived(item);
//         default:
//           return { code: 200 };
//       }
//     }
//   } catch (e) {
//     console.error(e);
//   }
// };

// /**
//  * @param {dayjs.Dayjs} day
//  * @param {Source} source
//  * @returns {Promise<[Item]|undefined>}
//  */
// exports.findReturnedItems = async (day, source) => {
//   try {
//     return await Item.find({
//       dateReturned: { $gte: day.startOf("d"), $lte: day.endOf("d") },
//       source,
//     });
//   } catch (e) {
//     console.error(e);
//   }
// };
