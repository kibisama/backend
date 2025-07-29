const dayjs = require("dayjs");
const customParseFormat = require("dayjs/plugin/customParseFormat");
dayjs.extend(customParseFormat);
const ITEM = require("../../schemas/item");

/**
 * @typedef {ITEM.Item} Item
 * @typedef {ITEM.Method} Method
 * @typedef {object} DataMatrix
 * @property {string} gtin
 * @property {string} lot
 * @property {string} sn
 * @property {string} exp
 * @typedef {"RECEIVE"|"FILL"|"REVERSE"|"RETURN"} Mode
 * @typedef {ITEM.Source} Source
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
 * Check if the scan is a duplicate fill.
 * @param {Item} item
 * @param {Mode} mode
 * @returns {boolean}
 */
exports.isDuplicateFill = (item, mode) => {
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
exports.isNewFill = (item, mode) => {
  if (mode === "FILL" && !item.dateFilled) {
    return true;
  }
  return false;
};
/**
 * Creates an Item document.
 * @param {DataMatrix} dm
 * @param {Method} method
 * @param {string} invoiceRef optional
 * @returns {Promise<Item|undefined>}
 */
const createItem = async (dm, method, invoiceRef) => {
  try {
    const { gtin, sn, lot } = dm;
    const exp = convertExpToDate(dm.exp);
    return await ITEM.create({ gtin, sn, lot, exp, method, invoiceRef });
  } catch (e) {
    console.error(e);
  }
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
    const item = await ITEM.findOneAndUpdate(
      createFilter(dm),
      { ...dm, method, invoiceRef },
      { new: true }
    );
    if (item === null) {
      return await createItem(dm, method, invoiceRef);
    }
    return item;
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
    /** @type {Parameters<ITEM["findOneAndUpdate"]>["1"]} */
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
    return await ITEM.findOneAndUpdate(createFilter(scanReq), update, {
      new: true,
    });
  } catch (e) {
    console.error(e);
  }
};
