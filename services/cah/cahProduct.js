const cahProduct = require("../../schemas/cah/cahProduct");
const package = require("../inv/package");
const { isAfterTodayStart, saveImg } = require("../common");
const getProductDetails = require("./getProductDetails");
const searchProduct = require("./searchProduct");
const {
  isProductInStock,
  interpretCAHData,
  formatCAHData,
  isProductEligible,
  interpretBooleanIcon,
  interpretBooleanText,
  calculateSize,
} = require("./common");
const { stringToNumber } = require("../convert");

/**
 * @typedef {import("mongoose").ObjectId} ObjectId
 * @typedef {cahProduct.CAHProduct} CAHProduct
 * @typedef {import("../inv/package").Package} Package
 * @typedef {Parameters<cahProduct["findOneAndUpdate"]>["0"]} Filter
 * @typedef {Parameters<cahProduct["findOneAndUpdate"]>["1"]} UpdateParam
 */

/** CONSTANTS **/
const defaultImgUrl =
  "https://cardinalhealth.bynder.com/transform/pharma-medium/6f60cc86-566e-48e2-8ab4-5f78c4b53f74/";
const saveImgPath = "img/pharma-medium/";

/**
 * @param {Package|ObjectId} package
 * @returns {Promise<CAHProduct|undefined>}
 */
exports.upsertProduct = async (package) => {
  try {
    const _cahProduct = await cahProduct.findOneAndUpdate(
      { package },
      {},
      { new: true, upsert: true }
    );
    exports.updateProduct(_cahProduct);
    return _cahProduct;
  } catch (e) {
    console.error(e);
  }
};

/**
 * Refreshes a CAHProduct documnet.
 * @param {CAHProduct|ObjectId} cahPrd
 * @returns {Promise<CAHProduct|undefined>}
 */
exports.refreshProduct = async (cahPrd) => {
  try {
    return await cahProduct.findById(cahPrd);
  } catch (e) {
    console.error(e);
  }
};

/**
 * @param {CAHProduct} cahPrd
 * @returns {boolean}
 */
const needsUpdate = (cahPrd) => {
  const { lastRequested } = cahPrd;
  if (!lastRequested || isAfterTodayStart(lastRequested)) {
    return true;
  }
  return false;
};

/**
 * @typedef {object} UpdateOption
 * @property {boolean} [force]
 * @property {boolean} [skipUpdateSource]
 * @property {Function} [callback]
 */

/**
 * Request a puppet to update a CAHProduct.
 * @param {CAHProduct} cahPrd
 * @param {UpdateOption} option
 * @returns {void}
 */
exports.updateProduct = async (cahPrd, option = {}) => {
  try {
    (option.force || needsUpdate(cahPrd)) &&
      getProductDetails(cahPrd, (data, _cahPrd) =>
        updateProductCallback(data, _cahPrd, option)
      ) &&
      (await cahPrd.updateOne({ $set: { lastRequested: new Date() } }));
  } catch (e) {
    console.error(e);
  }
};
/**
 * @param {getProductDetails.Data|null} data
 * @param {CAHProduct} _cahPrd
 * @param {UpdateOption} option
 * @returns {void}
 */
const updateProductCallback = async (data, _cahPrd, option) => {
  const { callback, skipUpdateSource } = option;
  try {
    const cahPrd = await exports.refreshProduct(_cahPrd);
    await cahPrd.populate({
      path: "package",
      populate: { path: "alternative" },
    });
    // handle 404
    if (data == null) {
      await cahPrd.updateOne({
        $set: { lastUpdated: new Date(), active: false },
      });
      if (!skipUpdateSource) {
        const { package } = cahPrd;
        const { alternative } = package;
        if (alternative?.cahProduct) {
          return exports.updateProduct(alternative.cahProduct);
        } else {
          return searchProduct(cahPrd.package.ndc11, searchProductCallback);
        }
      }
    }
    const result = data.data;
    const {
      cin,
      img,
      stockStatus,
      rebateEligible,
      returnable,
      rx,
      refrigerated,
      serialized,
      ...rest
    } = result;
    if (img && img !== defaultImgUrl) {
      await saveImg(`${saveImgPath + cin}.jpg`, img);
    }
    Object.assign(rest, evalHist(result));
    /** @type {UpdateParam} */
    const updateParam = {
      $set: {
        lastUpdated: new Date(),
        cin,
        stockStatus,
        ...rest,
        active: isProductEligible(stockStatus),
        rebateEligible: interpretBooleanIcon(rebateEligible),
        returnable: interpretBooleanIcon(returnable),
        rx: rx && interpretBooleanText(rx),
        refrigerated: refrigerated && interpretBooleanText(refrigerated),
        serialized: serialized && interpretBooleanText(serialized),
      },
    };
    // should be initialized before updateOne
    const { package } = cahPrd;
    const { alternative } = package;

    await cahPrd.updateOne(updateParam);
    await updatePackageSizeAndName(cahPrd);

    if (alternative) {
      const source = selectSource(result);
      if (alternative.isBranded === true) {
        await alternative.updateOne({ $set: { cahProduct: cahPrd } });
      } else if (alternative.isBranded === false && source) {
        // if orangebook code is not provided, the result will be set for alternative.cahProduct
        if (!source || source === result) {
          await alternative.updateOne({ $set: { cahProduct: cahPrd } });
        } else if (!skipUpdateSource) {
          const { ndc } = source;
          if (ndc) {
            // if the package is new, updateProduct will be called
            const { upsertPackage } = require("../inv/package");
            const pkg = await upsertPackage(ndc, "ndc11");
            // if not new, cahProduct field exists and call updateProduct
            if (pkg.cahProduct) {
              exports.updateProduct(
                await exports.refreshProduct(pkg.cahProduct)
              );
            }
          }
        }
      }
    }
    callback instanceof Function &&
      callback(await exports.refreshProduct(pkg.cahProduct));
  } catch (e) {
    console.error(e);
  }
};
/**
 * @param {getProductDetails.Data|null} data
 * @returns {void}
 */
const searchProductCallback = async (data) => {
  if (data == null) {
    return;
  }
  const result = data.data;
  const source = selectSource(result);
  if (!source || source === result) {
    const { gtin: _gtin, ndc: _ndc } = result;
    let gtin, ndc11;
    interpretCAHData(_gtin) && (gtin = _gtin);
    interpretCAHData(_ndc) && (ndc11 = _ndc);
    if (gtin && ndc11) {
      await package.upsertCompletePackage({ gtin, ndc11 });
    } else if (ndc11) {
      await package.upsertPackage(ndc11, "ndc11");
    }
  } else {
    const { ndc } = source;
    if (ndc) {
      const { upsertPackage } = require("../inv/package");
      const pkg = await upsertPackage(ndc, "ndc11");
      if (pkg.cahProduct) {
        exports.updateProduct(await exports.refreshProduct(pkg.cahProduct));
      }
    }
  }
};
/**
 * @param {getProductDetails.Result} result
 * @returns {getProductDetails.PurchaseHistoryEval}
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
 * Returns itself if it is the best source. Returns undefined if its orange book code missing.
 * @param {getProductDetails.Result} result
 * @returns {getProductDetails.Result|Alt|undefined}
 */
const selectSource = (result) => {
  const { alts, contract, stockStatus, netUoiCost, orangeBookCode } = result;
  if (!interpretCAHData(orangeBookCode)) {
    return;
  }
  if (alts.length > 0) {
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
    }
    const alt = cheapSrcInStock || cheapSrc || cheap;
    if (alt) {
      return alt;
    }
  }
  return result;
};
/**
 * @typedef {getProductDetails.Alt} Alt
 * @typedef {object} SelectAlt
 * @property {Alt} [cheapSrcInStock]
 * @property {Alt} [cheapSrc]
 * @property {Alt} [cheap]
 */
/**
 * @param {[Alt]} alts
 * @param {string} orangeBookCode
 * @returns {SelectAlt}
 */
const selectAlt = (alts, orangeBookCode) => {
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
    if (interpretCAHData(v.netUoiCost)) {
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
    }
  });
  return { cheapSrcInStock, cheapSrc, cheap };
};

/**
 * Updates the size & name fields of the linked Package document.
 * @param {CAHProduct} cahPrd populated
 * @returns {Promise<Awaited<ReturnType<Package["updateOne"]>>|undefined>}
 */
const updatePackageSizeAndName = async (cahPrd) => {
  try {
    let { package: pkg, size } = cahPrd;
    if (!size) {
      const { size: _size } = await exports.refreshProduct(cahPrd);
      size = _size;
    }
    if (size && !pkg.size) {
      await pkg.updateOne({ $set: { size: calculateSize(size) } });
      await package.updateName(await package.refreshPackage(pkg));
    }
  } catch (e) {
    console.error(e);
  }
};
