const dayjs = require("dayjs");
const { scheduleJob } = require("node-schedule");
const { cardinal } = require("../../api/puppet");
const cahProduct = require("./cahProduct");
const searchProducts = require("./searchProducts");
const { setCAHProduct } = require("../inv/alternative");
const { upsertPackage } = require("../inv/package");
const { stringToNumber } = require("../convert");
const { setOptionParameters, saveImg } = require("../common");
const {
  formatCAHData,
  isProductInStock,
  interpretCAHData,
  selectAlt,
} = require("./common");

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
 * Returns a native Date object indicating m minutes from now.
 * @param {Parameters<dayjs.Dayjs["add"]>["0"]} m
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
 * @property {string} [cin]
 * @property {string} [query]
 */

/**
 * @param {Package} package
 * @returns {Promise<Body>}
 */
const selectQuery = async (package) => {
  const { ndc, ndc11, gtin, cahProduct } = package;
  if (cahProduct) {
    try {
      const populated = await package.populate([
        { path: "cahProduct", select: ["cin"] },
      ]);
      const cin = populated.cahProduct.cin;
      if (cin) {
        return { cin };
      }
    } catch (e) {
      console.log(e);
    }
  }
  if (ndc11) {
    return { query: ndc11 };
  }
  if (ndc) {
    return { query: ndc };
  }
  if (gtin) {
    return { query: gtinToQuery(gtin) };
  }
};

/**
 * @param {Package} package
 * @param {boolean} updateSource
 * @param {Function} callback
 * @returns {Promise<undefined>}
 */
const handle404 = async (package, updateSource, callback) => {
  try {
    await cahProduct.voidProduct(package);
    if (updateSource) {
      const { alternative, ndc, ndc11 } = package;
      if (alternative) {
        const populated = await package.populate([
          {
            path: "alternative",
            populate: [{ path: "cahProduct", select: ["ndc"] }],
          },
        ]);
        if (populated.alternative.cahProduct?.ndc) {
          return module.exports(await upsertPackage(ndc, "ndc11"), {
            callback,
          });
        }
      }
      const q = ndc11 || ndc;
      if (q) {
        searchProducts(
          q,
          /**
           * @param {[Alt]} alts
           * @returns {undefined}
           */
          async (alts) => {
            const orangeBookCode = interpretCAHData(
              alts[alts.length - 1].orangeBookCode
            );
            if (!orangeBookCode) {
              return;
            }
            const { cheapSrcInStock, cheapSrc, cheap } = selectAlt(
              alts,
              orangeBookCode
            );
            const alt = cheapSrcInStock || cheapSrc || cheap;
            alt && updateSrc(alt, callback);
          }
        );
      }
    }
  } catch (e) {
    console.log(e);
  }
};

/**
 * Returns itself if it is the best.
 * @param {Result} result
 * @returns {Result|Alt|undefined}
 */
const selectSource = (result) => {
  const { alts, contract, stockStatus, netUoiCost, orangeBookCode } = result;
  if (alts.length > 0) {
    if (!interpretCAHData(orangeBookCode)) {
      return;
    }
    const { cheapSrcInStock, cheapSrc, cheap } = selectAlt(
      alts,
      orangeBookCode
    );
    if (interpretCAHData(netUoiCost)) {
      const numCost = stringToNumber(netUoiCost);
      const inStock = isProductInStock(stockStatus);
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
        if (
          contract ||
          (inStock && stringToNumber(cheap.netUoiCost) > numCost)
        ) {
          return result;
        }
        return cheap;
      }
    } else {
      const alt = cheapSrcInStock || cheapSrc || cheap;
      if (alt) {
        return alt;
      }
    }
  }
  return result;
};
/**
 * @param {Result} result
 * @returns {PurchaseHistoryEval}
 */
const evalHist = (result) => {
  const purchaseHistory = result.purchaseHistory;
  let lastCost;
  let histLow;
  let lastSFDCDate;
  let lastSFDCCost;
  if (purchaseHistory.length > 0) {
    purchaseHistory.forEach((v) => {
      const { invoiceCost, unitCost, orderMethod, invoiceDate } = v;
      if (invoiceCost === "$0.00" || invoiceCost.startsWith("-")) {
        return;
      }
      if (!lastCost) {
        lastCost = unitCost;
        histLow = unitCost;
      } else {
        if (stringToNumber(histLow) > stringToNumber(unitCost)) {
          histLow = unitCost;
        }
      }
      if (orderMethod === "SFDC") {
        if (!lastSFDCDate) {
          lastSFDCDate = invoiceDate;
          lastSFDCCost = unitCost;
        }
      }
    });
  }
  return {
    lastCost: formatCAHData(lastCost),
    histLow: formatCAHData(histLow),
    lastSFDCDate: formatCAHData(lastSFDCDate),
    lastSFDCCost: formatCAHData(lastSFDCCost),
  };
};

/**
 * @param {Alt} source
 * @param {Function} callback
 * @returns {Promise<undefined>}
 */
const updateSrc = async (source, callback) => {
  try {
    const { ndc } = source;
    await upsertPackage(ndc, "ndc11", {
      callback: async (package) => {
        await cahProduct.handleResult(package, source);
        module.exports(
          package.cahProduct ? package : await upsertPackage(ndc, "ndc11"),
          { force: true, callback }
        );
      },
    });
  } catch (e) {
    console.log(e);
  }
};

/**
 * @param {Alt} alt
 * @returns {boolean}
 */
const isAltGeneric = (alt) => {
  const { name, genericName } = alt;
  const index = genericName.indexOf(" ");
  return new RegExp(
    String.raw`${index > 0 ? genericName.substring(0, index) : genericName}`
  ).test(name);
};

/**
 * @param {Package} package
 * @param {Data} data
 * @param {boolean} updateSource
 * @param {Function} callback
 * @returns {Promise<undefined>}
 */
const handle200 = async (package, data, updateSource, callback) => {
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
    Object.assign(result, evalHist(result));
    const product = await cahProduct.handleResult(package, result);
    if (product && alternative) {
      const populated = await package.populate([
        { path: "alternative", select: ["isBranded"] },
      ]);
      const source = selectSource(result);
      if (source) {
        if (populated.alternative.isBranded) {
          await setCAHProduct(alternative, product._id);
          if (isAltGeneric(source)) {
            return updateSrc(source, callback);
          }
        } else {
          if (source === result) {
            await setCAHProduct(alternative, product._id);
          } else if (updateSource) {
            return updateSrc(source, callback);
          }
        }
      }
    }
    if (callback instanceof Function) {
      callback();
    }
  } catch (e) {
    console.log(e);
  }
};

/**
 * @param {Package} package
 * @param {boolean} updateSource
 * @param {Function} [callback]
 * @returns {undefined}
 */
const requestPuppet = async (package, updateSource, callback) => {
  const query = await selectQuery(package);
  let count = 0;
  const maxCount = 99;
  async function request() {
    try {
      const result = await cardinal.getProductDetails(query);
      if (result instanceof Error) {
        switch (result.status) {
          case 404:
            await handle404(package, updateSource, callback);
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
        await handle200(package, result.data, updateSource, callback);
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
 * @property {boolean} [updateSource]
 * @property {Function} [callback]
 */

/**
 * @param {Package} package
 * @param {RequestOption} [option]
 * @returns {Promise<undefined>}
 */
module.exports = async (package, option) => {
  try {
    const defaultOption = { force: false, updateSource: false };
    const { force, callback, updateSource } = setOptionParameters(
      defaultOption,
      option
    );
    if (force || (await cahProduct.needsUpdate(package))) {
      requestPuppet(package, updateSource, callback);
    }
  } catch (e) {
    console.log(e);
  }
};
