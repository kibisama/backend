const dayjs = require("dayjs");
const customParseFormat = require("dayjs/plugin/customParseFormat");
dayjs.extend(customParseFormat);
const item = require("../../schemas/item");

/**
 * @typedef {item.Item} Item
 * @typedef {item.Method} Method
 * @typedef {object} DataMatrix
 * @property {string} gtin
 * @property {string} lot
 * @property {string} sn
 * @property {string} exp
 * @typedef {"RECEIVE"|"FILL"|"REVERSE"|"RETURN"} Mode
 * @typedef {item.Source} Source
 * @typedef {object} ScanReqProp
 * @property {Mode} mode
 * @property {Source} [source]
 * @property {string} [cost]
 * @typedef {DataMatrix & ScanReqProp} ScanReq
 */

/**
 * @param {DataMatrix} dm
 * @returns {Parameters<item["findOne"]>["0"]}
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
 * Finds an Item document.
 * @param {DataMatrix} dm
 * @returns {Promise<Item|null|undefined>}
 */
const findItem = async (dm) => {
  try {
    const filter = createFilter(dm);
    return await item.findOne(filter);
  } catch (e) {
    console.log(e);
  }
};
/**
 * Check if the scan is a duplicate fill.
 * @param {Item} item
 * @param {Mode} mode
 * @returns {boolean}
 */
const isDuplicateFill = (item, mode) => {
  if (mode === "FILL" && item.dateFilled) {
    return true;
  }
  return false;
};
/**
 * Check if the scan is a new fill.
 * @param {Item} item
 * @param {Mode} mode
 * @returns {boolean}
 */
const isNewFill = (item, mode) => {
  if (mode === "FILL" && !item.dateFilled) {
    return true;
  }
  return false;
};
/**
 * Creates an Item document.
 * @param {DataMatrix} dm
 * @param {Method} method
 * @returns {Promise<Item|undefined>}
 */
const createItem = async (dm, method) => {
  try {
    const { gtin, sn, lot } = dm;
    const exp = convertExpToDate(dm.exp);
    return await item.create({ gtin, sn, lot, exp, method });
  } catch (e) {
    console.log(e);
  }
};
/**
 * Upserts an Item document.
 * @param {DataMatrix} dm
 * @param {Method} method
 * @returns {Promise<Item|undefined>}
 */
const upsertItem = async (dm, method) => {
  try {
    const item = await findItem(dm);
    if (item === null) {
      return await createItem(dm, method);
    }
    return item;
  } catch (e) {
    console.log(e);
  }
};
/**
 * Updates an Item document.
 * @param {ScanReq} scanReq
 * @param {Date} [date]
 * @returns {Promise<Item|undefined>}
 */
const updateItem = async (scanReq, date) => {
  try {
    const { mode, source, cost } = scanReq;
    const now = date instanceof Date ? date : new Date();
    const filter = createFilter(scanReq);
    /** @type {Parameters<item["findOneAndUpdate"]>["1"]} */
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
    return await item.findOneAndUpdate(filter, update, { new: true });
  } catch (e) {
    console.log(e);
  }
};
/**
 * @param {Item} item
 * @param {Method} method
 * @returns {Promise<void>}
 */
const setMethod = async (item, method) => {
  try {
    await item.updateOne({ $set: { method } });
  } catch (e) {
    console.log(e);
  }
};
module.exports = {
  findItem,
  isDuplicateFill,
  isNewFill,
  upsertItem,
  updateItem,
  setMethod,
};
