/**
 * @typedef {import("../../schemas/cahProduct").CAHData} CAHData
 * @typedef {import("../../schemas/cahProduct").StockStatus} StockStatus
 * @typedef {import("../../schemas/cahProduct").BooleanText} BooleanText
 * @typedef {import("../../schemas/cahProduct").BooleanIcon} BooleanIcon
 * @typedef {import("../../schemas/cahProduct").BooleanTextCaps} BooleanTextCaps
 * @typedef {import("./getProductDetails").Alt} Alt
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
  /**
   * @typedef {object} SelectAlt
   * @property {Alt} [cheapSrcInStock]
   * @property {Alt} [cheapSrc]
   * @property {Alt} [cheap]
   * @param {[Alt]} alts
   * @param {string} orangeBookCode
   * @returns {SelectAlt}
   */
  selectAlt(alts, orangeBookCode) {
    /** @type {Alt} */
    let cheapSrcInStock;
    /** @type {Alt} */
    let cheapSrc;
    /** @type {Alt} */
    let cheap;
    alts.forEach((v) => {
      if (orangeBookCode !== v.orangeBookCode) {
        return;
      }
      const numCost = stringToNumber(v.netUoiCost);
      if (v.contract) {
        if (isProductInStock(v.stockStatus)) {
          if (!cheapSrcInStock) {
            cheapSrcInStock = v;
          } else if (stringToNumber(cheapSrcInStock.netUoiCost) > numCost) {
            cheapSrcInStock = v;
          }
        } else if (!cheapSrc) {
          cheapSrc = v;
        } else if (stringToNumber(cheapSrc.netUoiCost) > numCost) {
          cheapSrc = v;
        }
      } else if (!cheap) {
        cheap = v;
      } else if (stringToNumber(cheap.netUoiCost) > numCost) {
        cheap = v;
      }
    });
    return { cheapSrcInStock, cheapSrc, cheap };
  },
};
