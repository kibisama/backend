/**
 * @typedef {import("../../schemas/cah/cahProduct").CAHData} CAHData
 * @typedef {import("../../schemas/cah/cahProduct").StockStatus} StockStatus
 * @typedef {import("../../schemas/cah/cahProduct").BooleanText} BooleanText
 * @typedef {import("../../schemas/cah/cahProduct").BooleanIcon} BooleanIcon
 * @typedef {import("../../schemas/cah/cahProduct").BooleanTextCaps} BooleanTextCaps
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
   * @param {BooleanText|BooleanTextCaps} boolText
   * @returns {boolean}
   */
  interpretBooleanText(boolText) {
    if (boolText === "Yes" || boolText === "YES") {
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
  /**
   * @param {string} size
   * @returns {string}
   */
  calculateSize(size) {
    const match = size.match(/[\d.]+/g);
    if (match) {
      return (Number(match[0]) * Number(match[1])).toString();
    }
  },
};
