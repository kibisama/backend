/**
 * @typedef {import("../../schemas/cahProduct").CAHData} CAHData
 * @typedef {import("../../schemas/cahProduct").StockStatus} StockStatus
 * @typedef {import("../../schemas/cahProduct").BooleanText} BooleanText
 * @typedef {import("../../schemas/cahProduct").BooleanIcon} BooleanIcon
 * @typedef {import("../../schemas/cahProduct").BooleanTextCaps} BooleanTextCaps
 */

/**
 * @param {CAHData} cahData
 * @returns {string|null}
 */
const interpretCAHData = (cahData) => {
  if (cahData === "— —") {
    return null;
  } else {
    return cahData;
  }
};
/**
 * @param {string|null|undefined} data
 * @returns {CAHData}
 */
const formatCAHData = (data) => {
  if (data) {
    return data;
  } else if (data == null) {
    return "— —";
  }
};
/**
 * @param {BooleanText} boolText
 * @returns {boolean}
 */
const interpretBooleanText = (boolText) => {
  if (boolText === "Yes") {
    return true;
  } else {
    return false;
  }
};
/**
 * @param {BooleanTextCaps} boolTextCaps
 * @returns {boolean}
 */
const interpretBooleanTextCaps = (boolTextCaps) => {
  if (boolTextCaps === "YES") {
    return true;
  } else {
    return false;
  }
};
/**
 * @param {BooleanIcon} booleanIcon
 * @returns {boolean}
 */
const interpretBooleanIcon = (booleanIcon) => {
  if (booleanIcon === "done") {
    return true;
  } else {
    return false;
  }
};
/**
 * @param {StockStatus} status
 * @returns {boolean}
 */
const IsProductEligible = (status) => {
  switch (status) {
    case "IN STOCK":
      return true;
    case "LOW STOCK":
      return true;
    case "OUT OF STOCK":
      return true;
    default:
      return false;
  }
};
/**
 * @param {StockStatus} status
 * @returns {boolean}
 */
const IsProductInStock = (status) => {
  return status === "IN STOCK" || status === "LOW STOCK";
};

module.exports = {
  interpretCAHData,
  formatCAHData,
  interpretBooleanText,
  interpretBooleanTextCaps,
  interpretBooleanIcon,
  IsProductEligible,
  IsProductInStock,
};
