const { scheduleJob } = require("node-schedule");
const { cardinal } = require("../../api/puppet");
const { ndcToNDC11 } = require("../convert");
const { setDelay } = require("../common");

/**
 * @typedef {import("../../schemas/cah/cahProduct").CAHProduct} CAHProduct
 * @typedef {import("../../schemas/cah/cahProduct").CAHData} CAHData
 * @typedef {import("../../schemas/cah/cahProduct").StockStatus} StockStatus
 * @typedef {import("../../schemas/cah/cahProduct").BooleanIcon} BooleanIcon
 * @typedef {import("../../schemas/cah/cahProduct").BooleanText} BooleanText
 * @typedef {import("../../schemas/cah/cahProduct").BooleanTextCaps} BooleanTextCaps
 * @typedef {object} Data
 * @property {number} code
 * @property {Result} data
 * @typedef {Alt & Product} Result
 * @typedef {object} Product
 * @property {string} img
 * @property {CAHData} gtin
 * @property {CAHData} mpn
 * @property {CAHData} brandName
 * @property {CAHData} amu
 * @property {CAHData} size
 * @property {CAHData} form
 * @property {CAHData} strength
 * @property {CAHData} unit
 * @property {BooleanText} rx
 * @property {BooleanText} refrigerated
 * @property {BooleanTextCaps} serialized
 * @property {string} avlAlertUpdated
 * @property {string} avlAlertAddMsg
 * @property {string} avlAlertExpected
 * @property {[Alt]} alts
 * @property {[PurchaseHistory]} purchaseHistory
 * @typedef {object} Alt
 * @property {CAHData} name
 * @property {CAHData} genericName
 * @property {CAHData} ndc
 * @property {CAHData} cin
 * @property {CAHData} upc
 * @property {CAHData} mfr
 * @property {CAHData} orangeBookCode
 * @property {CAHData} estNetCost
 * @property {CAHData} netUoiCost
 * @property {CAHData} lastOrdered
 * @property {string} [contract]
 * @property {StockStatus} stockStatus
 * @property {BooleanIcon} rebateEligible
 * @property {BooleanIcon} returnable
 * @typedef {object} PurchaseHistory
 * @property {string} orderDate
 * @property {string} invoiceDate
 * @property {string} invoiceCost
 * @property {string} orderQty
 * @property {string} shipQty
 * @property {string} unitCost
 * @property {"VantusHQ Web Order"|"SFDC"} orderMethod
 * @property {CAHData} poNumber
 * @property {string} contract
 * @property {string} invoiceNumber
 * @typedef {object} PurchaseHistoryEval
 * @property {string} lastCost
 * @property {string} histLow
 * @property {CAHData} lastSFDCDate
 * @property {CAHData} lastSFDCCost
 */

/**
 * @typedef {object} Body
 * @property {string} [cin]
 * @property {string} [q]
 * @property {"ndc"} [type]
 */
/**
 * @param {CAHProduct} cahPrd
 * @returns {Body|undefined}
 */
const selectQuery = (cahPrd) => {
  const { cin, package } = cahPrd;
  if (cin) {
    return { cin };
  }
  const { ndc, ndc11 } = package;
  if (!(ndc || ndc11)) {
    return;
  }
  return { type: "ndc", q: ndc11 ? ndc11 : ndcToNDC11(ndc) };
};

/**
 * @param {CAHProduct} _cahPrd
 * @param {function} callback
 * @returns {Promise<void>}
 */
module.exports = async (cahPrd, callback) => {
  await cahPrd.populate({
    path: "package",
    populate: { path: "alternative" },
  });
  const query = selectQuery(cahPrd);
  if (!query) {
    return;
  }
  let count = 0;
  const maxCount = 9;
  async function request() {
    try {
      const result = await cardinal.getProductDetails(query);
      if (result instanceof Error) {
        switch (result.status) {
          case 400:
            break;
          case 404:
            callback(null, cahPrd);
            break;
          case 500:
            if (count < maxCount) {
              count++;
              scheduleJob(setDelay(15), request);
            }
            break;
          case 503:
            scheduleJob(setDelay(3), request);
            break;
          default:
        }
      } else {
        callback(result.data, cahPrd);
      }
    } catch (e) {
      console.error(e);
    }
  }
  request();
};
