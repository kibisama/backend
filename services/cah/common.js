/**
 * @typedef {import("../../schemas/cahProduct").CAHData} CAHData
 * @typedef {import("../../schemas/cahProduct").StockStatus} StockStatus
 * @typedef {import("../../schemas/cahProduct").BooleanText} BooleanText
 * @typedef {import("../../schemas/cahProduct").BooleanIcon} BooleanIcon
 * @typedef {import("../../schemas/cahProduct").BooleanTextCaps} BooleanTextCaps
 */

module.exports = {
  /**
   * @param {CAHData} cahData
   * @returns {string|null}
   */
  interpretCAHData(cahData) {
    if (cahData === "— —") {
      return null;
    } else {
      return cahData;
    }
  },
  /**
   * @param {string|null|undefined} data
   * @returns {CAHData}
   */
  formatCAHData(data) {
    if (data) {
      return data;
    } else if (data == null) {
      return "— —";
    }
  },
  /**
   * @param {BooleanText} boolText
   * @returns {boolean}
   */
  interpretBooleanText(boolText) {
    if (boolText === "Yes") {
      return true;
    } else {
      return false;
    }
  },
  /**
   * @param {BooleanTextCaps} boolTextCaps
   * @returns {boolean}
   */
  interpretBooleanTextCaps(boolTextCaps) {
    if (boolTextCaps === "YES") {
      return true;
    } else {
      return false;
    }
  },
  /**
   * @param {BooleanIcon} booleanIcon
   * @returns {boolean}
   */
  interpretBooleanIcon(booleanIcon) {
    if (booleanIcon === "done") {
      return true;
    } else {
      return false;
    }
  },
  /**
   * @param {StockStatus} status
   * @returns {boolean}
   */
  isProductEligible(status) {
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
  },
  /**
   * @param {StockStatus} status
   * @returns {boolean}
   */
  isProductInStock(status) {
    return status === "IN STOCK" || status === "LOW STOCK";
  },
};
