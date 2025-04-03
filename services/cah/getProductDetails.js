const dayjs = require("dayjs");

const { scheduleJob } = require("node-schedule");
const { cardinal } = require("../../api/puppet");
const cahProduct = require("./cahProduct");
// const psAlt = require("./psAlternative");
const { stringToNumber } = require("../convert");
const { setOptionParameters, saveImg } = require("../common");

const defaultImgUrl =
  "https://cardinalhealth.bynder.com/transform/pharma-medium/6f60cc86-566e-48e2-8ab4-5f78c4b53f74/";

/**
 * @typedef {cahProduct.Package} Package
 * @typedef {import("../../schemas/cahProduct").CAHData} CAHData
 * @typedef {import("../../schemas/cahProduct").StockStatus} StockStatus
 * @typedef {import("../../schemas/cahProduct").BooleanIcon} BooleanIcon
 * @typedef {import("../../schemas/cahProduct").BooleanText} BooleanText
 * @typedef {import("../../schemas/cahProduct").BooleanTextCaps} BooleanTextCaps
 * @typedef {object} Data
 * @property {Result} results
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
 * @property {string} [stock]
 * @property {BooleanIcon} rebateEligible
 * @property {BooleanIcon} returnable
 * @typedef {object} PurchaseHistory
 * @property {string} orderDate
 * @property {string} invoiceDate
 * @property {string} invoiceCost
 * @property {string} orderQty
 * @property {string} shipQty
 * @property {string} unitCost
 * @property {string} orderMethod
 * @property {string} poNumber
 * @property {string} contract
 * @property {string} invoiceNumber
 */

/**
 * Returns a native Date object indicating m minutes from now.
 * @param {*} m
 * @returns {Date}
 */
const setDelay = (m) => {
  return dayjs().add(m, "minute").toDate();
};

/**
 * @param {string} gtin
 * @returns {string}
 */
const gtinToQuery = (gtin) => {
  return gtin.slice(3, 13);
};

/**
 * @typedef {object} Body
 * @property {string} [ndc11]
 * @property {string} [query]
 */

/**
 * @param {Package} package
 * @returns {Body}
 */
const selectQuery = async (package) => {
  const { cahProduct, ndc, gtin } = package;
  if (cahProduct) {
    const populated = await package.populate([
      { path: "cahProduct", select: ["cin"] },
    ]);
    const cin = populated.cahProduct.cin;
    if (cin) {
      return { cin };
    }
  }
  if (ndc) {
    return { query: ndc };
  } else if (gtin) {
    return { query: gtinToQuery(gtin) };
  }
};

/**
 * @param {Package} package
 * @returns {Promise<undefined>}
 */
const handle404 = async (package) => {
  try {
    await cahProduct.voidProduct(package);
    // optional update alternative
  } catch (e) {
    console.log(e);
  }
};

/**
 * @param {StockStatus} stockStatus
 * @returns {boolean}
 */
const isInStock = (stockStatus) => {
  return stockStatus === "IN STOCK" || stockStatus === "LOW STOCK";
};

/**
 * Returns itself if it is the best.
 * @param {Result} result
 * @returns {Result|Alt}
 */
const selectSource = (result) => {
  const { alts, contract, stockStatus, netUoiCost, orangeBookCode } = result;
  /** @type {Alt} */
  let cheapSrcInStock;
  /** @type {Alt} */
  let cheapSrc;
  /** @type {Alt} */
  let cheap;
  if (alts.length > 0) {
    alts.forEach((v) => {
      if (orangeBookCode && orangeBookCode !== v.orangeBookCode) {
        return;
      }
      const numCost = stringToNumber(v.netUoiCost);
      if (v.contract) {
        if (isInStock(v.stockStatus)) {
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
  }
  const numCost = stringToNumber(netUoiCost);
  const inStock = isInStock(stockStatus);
  if (cheapSrcInStock) {
    if (contract && inStock) {
      if (stringToNumber(cheapSrcInStock.netUoiCost) > numCost) {
        return result;
      }
    }
    return cheapSrcInStock;
  } else if (cheapSrc) {
    if (contract) {
      if (inStock || stringToNumber(cheapSrc.netUoiCost) > numCost) {
        return result;
      }
    }
    return cheapSrc;
  } else if (cheap) {
    if (contract || stringToNumber(cheap.netUoiCost) > numCost) {
      return result;
    }
    return cheap;
  }
  return result;
};

/**
 * @param {Package} package
 * @param {Data} data
 * @returns {Promise<undefined>}
 */
const handle200 = async (package, data) => {
  try {
    const result = data.results;
    const { cin, img } = result;
    if (img && img !== defaultImgUrl) {
      await saveImg(`img/pharma-medium/${cin}.jpg`, img);
    }
    const { ndc11, gtin, alternative } = package;
    if (!ndc11 || !gtin) {
      // update package via cah
    }
    await cahProduct.handleResult(package, result);
    console.log(selectSource(result));
    // update
  } catch (e) {
    console.log(e);
  }
};

/**
 * @param {Package} package
 * @param {Function} [callback]
 * @returns {undefined}
 */
const requestPuppet = (package, callback) => {
  const query = selectQuery(package);
  let count = 0;
  const maxCount = 99;
  async function request() {
    try {
      const result = await cardinal.getProductDetails(query);
      if (result instanceof Error) {
        switch (result.status) {
          case 404:
            await handle404(package);
            break;
          case 500:
            if (count < maxCount) {
              count++;
              scheduleJob(setDelay(5), request);
            }
            break;
          case 503:
            scheduleJob(setDelay(3), request);
            break;
          default:
        }
      } else {
        await handle200(package, result.data);
        if (callback instanceof Function) {
          callback();
        }
      }
    } catch (e) {
      console.log(e);
    }
  }
  request();
};

/**
 * @typedef {object} RequestOption
 * @property {boolean} [force]
 * @property {Function} [callback]
 */

/**
 * @param {Package} package
 * @param {RequestOption} [option]
 * @returns {Promise<undefined>}
 */
module.exports = async (package, option) => {
  try {
    const defaultOption = { force: false };
    const { force, callback } = setOptionParameters(defaultOption, option);
    if (force || (await cahProduct.needsUpdate(package))) {
      requestPuppet(package, callback);
    }
  } catch (e) {
    console.log(e);
  }
};
