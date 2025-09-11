const dayjs = require("dayjs");
const customParseFormat = require("dayjs/plugin/customParseFormat");
dayjs.extend(customParseFormat);
const Item = require("../../schemas/inv/item");
const { checkItemCondition } = require("../cah/returnRequest");

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
 * @returns {dayjs.Dayjs}
 */
const convertExpToDate = (exp) => {
  return dayjs(exp, "YYMMDD");
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
      {
        $set: {
          lot: dm.lot,
          exp: convertExpToDate(dm.exp).toDate(),
          method,
          invoiceRef,
        },
      },
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
 * @param {Item} [item]
 * @returns {Promise<void>}
 */
exports.updateItem = async (scanReq, date, item) => {
  try {
    const { mode, source, cost, gtin } = scanReq;
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
        update.$unset = { dateFilled: 1, dateReturned: 1 };
        break;
      case "RETURN":
        update.$set = { dateReturned: now };
        break;
      default:
    }
    if (item) {
      await item.updateOne(update);
    } else {
      await Item.findOneAndUpdate(createFilter(scanReq), update, {
        new: true,
      });
    }
    /** Updating __invUsageChecker && __invUsageToday **/
    if (mode === "FILL" || mode === "REVERSE") {
      const day = dayjs(now);
      if (day.isSame(dayjs(), "d")) {
        const { useInvUsageChecker, getUsages } = require("./inventory");
        useInvUsageChecker(day.format("MMDDYYYY"), gtin, true);
        getUsages(undefined, true);
      }
    }
  } catch (e) {
    console.error(e);
  }
};
/**
 * @param {Item} item
 * @returns {boolean}
 */
exports.isItemExpired = (item) => {
  return dayjs().isAfter(convertExpToDate(item.exp));
};
/**
 * @param {string} gtin
 * @param {} [sort]
 * @returns {Promise<[Item]|undefined>}
 */
exports.findItemsByGTIN = async (gtin, sort) => {
  try {
    return await Item.find({ gtin }, {}, { sort });
  } catch (e) {
    console.error(e);
  }
};
/**
 * @param {Item} item
 * @returns {import("../common").Response}
 */
exports.preprocessReturn = (item) => {
  try {
    const { dateFilled, dateReceived, source } = item;
    if (dateFilled) {
      return { code: 409, message: "The item has been already filled." };
    }
    if (!dateReceived) {
      return {
        code: 409,
        message: "The date received for the item has not recorded.",
      };
    }
    switch (source) {
      case "CARDINAL":
        return checkItemCondition(item);
      default:
        return { code: 200 };
    }
  } catch (e) {
    console.error(e);
  }
};
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

/**
 * @param {string|Date|undefined} date
 * @returns {Promise<[Item]|undefined>}
 */
exports.findItemsByFilledDate = async (date) => {
  try {
    const day =
      typeof date === "string" ? dayjs(date, "MMDDYYYY") : dayjs(date);
    return await Item.find({
      dateFilled: { $gte: day.startOf("day"), $lte: day.endOf("day") },
    }).sort({ dateFilled: -1 }); // from latest to oldest
  } catch (e) {
    console.error(e);
  }
};
