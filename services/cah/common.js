/**
 * @typedef {import("../../schemas/cahProduct").CAHData} CAHData
 * @typedef {import("../../schemas/cahProduct").BooleanText} BooleanText
 * @typedef {import("../../schemas/cahProduct").BooleanIcon} BooleanIcon
 * @typedef {import("../../schemas/cahProduct").BooleanTextCaps} BooleanTextCaps
 */

/**
 * @param {CAHData} cahData
 * @returns {string|undefined}
 */
const interpretCAHData = (cahData) => {
  if (cahData === "— —") {
    return;
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

module.exports = {
  interpretCAHData,
  formatCAHData,
  interpretBooleanText,
  interpretBooleanTextCaps,
  interpretBooleanIcon,
};
