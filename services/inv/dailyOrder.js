const dayjs = require("dayjs");
const dailyOrder = require("../../schemas/dailyOrder");
const item = require("../../schemas/item");
const package = require("./package");
const getSearchResults = require("../ps/getSearchResults");
const getProductDetails = require("../cah/getProductDetails");
const { interpretCAHData } = require("../cah/common");
const { hyphenateNDC11 } = require("../convert");

/**
 * @typedef {dailyOrder.DailyOrder} DailyOrder
 * @typedef {import("./package").Package} Package
 * @typedef {import("../cah/cahProduct").CAHProduct} CAHProduct
 * @typedef {import("../ps/psPackage").PSPackage} PSPackage
 * @typedef {import("../ps/psAlternative").PSAlternative} PSAlternative
 * @typedef {Parameters<dailyOrder["findOneAndUpdate"]>["1"]} UpdateParam
 * @typedef {Parameters<dailyOrder["findOne"]>["0"]} Filter
 */

/**
 * @returns {UpdateParam}
 */
const createUpdateParam = () => {
  return { $set: { lastUpdated: new Date() } };
};
/**
 * @param {Package} package
 * @returns {Filter}
 */
const createFilter = (package) => {
  return { package: package._id, date: { $gte: getTodayStart() } };
};
/**
 * @returns {dayjs.Dayjs}
 */
const getTodayStart = () => {
  return dayjs().startOf("date");
};
/**
 * @param {Date}
 * @returns {boolean}
 */
const isNew = (date) => {
  if (!(date instanceof Date)) {
    throw new Error();
  }
  return dayjs(date).isAfter(getTodayStart());
};
/**
 * @param {Package} package
 * @returns {Promise<DailyOrder|undefined>}
 */
const createDO = async (package) => {
  try {
    const now = new Date();
    return await dailyOrder.create({
      package: package._id,
      lastUpdated: now,
      date: now,
    });
  } catch (e) {
    console.log(e);
  }
};
/**
 * @param {Package} package
 * @returns {Promise<DailyOrder|undefined>}
 */
const findDO = async (package) => {
  try {
    return (await dailyOrder.findOne(createFilter(package))) ?? undefined;
  } catch (e) {
    console.log(e);
  }
};
/**
 * @param {string} date
 * @returns {Promise<[DailyOrder]|undefined>}
 */
const findDOByDateString = async (date) => {
  try {
    const day = dayjs(date, "MM-DD-YYYY");
    return await dailyOrder
      .find({
        date: { $gte: day.startOf("d"), $lte: day.endOf("d") },
      })
      .sort({ date: 1 });
  } catch (e) {
    console.log(e);
  }
};
/**
 * @param {Package} package
 * @returns {Promise<DailyOrder|undefined>}
 */
const upsertDO = async (package) => {
  try {
    let _dailyOrder = await findDO(package);
    if (!_dailyOrder) {
      _dailyOrder = await createDO(package);
      updateSources(package);
    }
    await updateAltDOs(package);
    return await updateFilledItems(_dailyOrder, package.gtin);
  } catch (e) {
    console.log(e);
  }
};
/**
 * @param {Package} pkg
 * @returns {Promise<void>}
 */
const updateAltDOs = async (pkg) => {
  try {
    const altPkgs = await package.findAltPackages(pkg);
    if (altPkgs?.length > 0) {
      const dOs = await dailyOrder.find({
        status: { $ne: "FILLED" },
        package: { $in: altPkgs.map((v) => v._id) },
        date: { $gte: getTodayStart() },
      });
      if (dOs?.length > 0) {
        for (let i = 0; i < dOs.length; i++) {
          const populatedDO = await populateDO(dOs[i]);
          await updateStocks(populatedDO);
        }
      }
    }
  } catch (e) {
    console.log(e);
  }
};
/**
 * @param {string} gtin
 * @returns {Promise<[item.Item]|undefined>}
 */
const findFilledItems = async (gtin) => {
  try {
    return await item
      .find({
        gtin,
        dateFilled: { $gte: getTodayStart() },
      })
      .sort({ dateFilled: 1 });
  } catch (e) {
    console.log(e);
  }
};
/**
 * @param {DailyOrder} dO
 * @param {string} gtin
 * @returns {Promise<DailyOrder|undefined>}
 */
const updateFilledItems = async (dO, gtin) => {
  try {
    let _dO = dO;
    const items = await findFilledItems(gtin);
    if (items) {
      const updateParam = createUpdateParam();
      if (items.length > 0) {
        const date = items[items.length - 1].dateFilled;
        updateParam.$set.date = date;
      }
      updateParam.$set.items = items.map((v) => v._id);
      _dO = await dailyOrder.findOneAndUpdate({ _id: dO._id }, updateParam, {
        new: true,
      });
    }
    await updateStocks(await populateDO(_dO));
    return _dO;
  } catch (e) {
    console.log(e);
  }
};
/**
 * @param {Package} pkg
 * @param {boolean} [force]
 * @returns {Promise<undefined>}
 */
const updateSources = (pkg, force) => {
  try {
    const callback = async () => {
      updateDO(await package.updatePackage(pkg));
    };
    getSearchResults(pkg, { callback, force });
    getProductDetails(pkg, { updateSource: true, callback, force });
  } catch (e) {
    console.log(e);
  }
};
/**
 * @param {DailyOrder} dO
 * @returns {Promise<ReturnType<dailyOrder["findOne"]>|undefined>}
 */
const populateDO = async (dO) => {
  try {
    return await dO.populate({
      path: "package",
      populate: [
        { path: "cahProduct" },
        { path: "psPackage" },
        {
          path: "alternative",
          populate: [
            { path: "cahProduct" },
            { path: "psAlternative" },
            { path: "genAlt", populate: "cahProduct" },
          ],
        },
      ],
    });
  } catch (e) {
    console.log(e);
  }
};
/**
 * @param {Package} package
 * @returns {Promise<|undefined>}
 */
const updateDO = async (package) => {
  try {
    const _dO = await dailyOrder.findOne(createFilter(package));
    if (!_dO) {
      return;
    }
    const dO = await populateDO(_dO);
    switch (dO.status) {
      case "FILLED":
        if (isSourceUpdated(dO)) {
          await dO.updateOne({ $set: { data: generateData(dO) } });
          await updateStocks(dO);
          await updateStatus(dO);
        } else {
          return;
        }
      // no break
      case "UPDATED":
      default:
    }
  } catch (e) {
    console.log(e);
  }
};
/**
 * @param {DailyOrder} dO
 * @returns {Promise<void>}
 */
const updateStatus = async (dO) => {
  try {
    /** @type {dailyOrder.DailyOrderStatus} */
    const status = dO.status;
    /** @type {dailyOrder.DailyOrderStatus} */
    let _status;
    switch (status) {
      case "FILLED":
        _status = "UPDATED";
        break;
      default:
    }
    await dO.updateOne({ $set: { status: _status } });
  } catch (e) {
    console.log(e);
  }
};

/**
 * @param {DailyOrder} populatedDO
 * @returns {boolean}
 */
const isSourceUpdated = (populatedDO) => {
  /** @type {Package} */
  const { cahProduct, psPackage, alternative } = populatedDO.package;
  if (
    cahProduct &&
    psPackage &&
    isNew(cahProduct.lastUpdated) &&
    isNew(psPackage.lastUpdated)
  ) {
    if (alternative) {
      const source = alternative.cahProduct;
      if (source && source.invoiceCost && isNew(source.lastUpdated)) {
        if (alternative.isBranded === true) {
          const genSource = alternative.genAlt?.cahProduct;
          if (genSource) {
            if (!isNew(genSource.lastUpdated)) {
              return false;
            }
          }
        }
        return true;
      }
    } else {
      return true;
    }
  }
  return false;
};
/**
 * @typedef {object} ColumnData
 * @property {string} title
 * @property {string} [subtitle]
 * @property {Data} [data]
 * @typedef {"NA"|"PENDING"|"ERROR"} ColumnStatus
 * @typedef {ColumnData|ColumnStatus} Column
 * @typedef {object} Row
 * @property {ColumnData} date
 * @property {ColumnData} package
 * @property {ColumnData} qty
 * @property {Column} cahPrd
 * @property {Column} cahSrc
 * @property {Column} psPkg
 * @property {Column} psAlt
 * @typedef {object} Data
 * @property {Date} lastUpdated
 * @property {object} data
 */

/**
 * @param {DailyOrder} populatedDO
 * @returns {Row}
 */
const generateData = (populatedDO) => {
  /** @type {Row} */
  const data = {};
  data.date = getDate(populatedDO);
  data.package = getPackage(populatedDO);
  data.qty = getQty(populatedDO);
  data.cahPrd = getCAHPrd(populatedDO);
  data.cahSrc = getCAHSrc(populatedDO);
  data.psPkg = getPSPkg(populatedDO);
  data.psAlt = getPSAlt(populatedDO);
  return data;
};
/**
 * @param {DailyOrder} populatedDO
 * @returns {ColumnData}
 */
const getDate = (populatedDO) => {
  return { title: dayjs(populatedDO.date).format("hh:mm A") };
};
/**
 * @param {DailyOrder} populatedDO
 * @returns {ColumnData}
 */
const getPackage = (populatedDO) => {
  const pkg = populatedDO.package;
  return {
    title: getName(populatedDO),
    subtitle: getMfrName(populatedDO),
    data: {
      data: {
        ndc11: pkg.ndc11,
        size: pkg.size,
        stock: package.getNumberInStock(pkg),
      },
    },
  };
};
/**
 * @param {DailyOrder} populatedDO
 * @returns {string}
 */
const getName = (populatedDO) => {
  const package = populatedDO.package;
  if (package.name) {
    return package.name;
  }
  if (package.alternative?.defaultName) {
    return package.alternative.defaultName;
  }
  const name = package.cahProduct?.name;
  if (name) {
    return name;
  }
  const description = package.psPackage?.description;
  if (description) {
    return description;
  }
  const { ndc11, ndc, gtin } = package;
  return ndc11 || ndc || gtin;
};
/**
 * @param {DailyOrder} populatedDO
 * @returns {string}
 */
const getMfrName = (populatedDO) => {
  const package = populatedDO.package;
  if (package.mfrName) {
    return package.mfrName;
  }
  const mfr = package.cahProduct.mfr;
  if (mfr) {
    return mfr;
  }
  const manufacturer = package.psPackage.manufacturer;
  if (manufacturer) {
    return manufacturer;
  }
  return "";
};
/**
 * @param {DailyOrder} populatedDO
 * @returns {ColumnData}
 */
const getQty = (populatedDO) => {
  return {
    title: populatedDO.items.length.toString(),
  };
};
/**
 * @param {DailyOrder} populatedDO
 * @returns {Promise<void>}
 */
const updateStocks = async (populatedDO) => {
  try {
    const pkg = populatedDO.package;
    await populatedDO.updateOne({
      "data.date.title": dayjs(populatedDO.date).format("hh:mm A"),
      "data.qty.title": populatedDO.items.length.toString(),
      "data.package.data.data.stock": package.getNumberInStock(pkg).toString(),
      "data.package.data.data.altStocks": await package.getAltStocks(pkg),
    });
  } catch (e) {
    console.log(e);
  }
};
/**
 * @param {DailyOrder} populatedDO
 * @returns {Column}
 */
const getCAHPrd = (populatedDO) => {
  const cahPrd = populatedDO.package.cahProduct;
  if (!cahPrd) {
    return "PENDING";
  } else if (!cahPrd.active) {
    return "NA";
  }
  return {
    title: cahPrd.estNetCost,
    subtitle: cahPrd.netUoiCost,
    data: getData(cahPrd, getCAHData(cahPrd)),
  };
};
/**
 * @param {DailyOrder} populatedDO
 * @returns {ColumnData}
 */
const getCAHSrc = (populatedDO) => {
  const cahPrd = populatedDO.package.cahProduct;
  const alt = populatedDO.package.alternative;
  const cahSrc = alt?.cahProduct;
  if (!cahSrc) {
    if (alt) {
      return "PENDING";
    } else {
      return "ERROR";
    }
  }
  if (cahPrd) {
    if (cahPrd._id.equals(cahSrc._id)) {
      if (cahPrd.contract) {
        return { title: cahPrd.contract };
      } else if (interpretCAHData(cahPrd.brandName) || alt.isBranded === true) {
        const genAltCAHPrd = alt.genAlt?.cahProduct;
        if (genAltCAHPrd) {
          return {
            title: "BRAND*",
            data: getData(genAltCAHPrd, getCAHData(genAltCAHPrd)),
          };
        } else {
          return { title: "BRNAD" };
        }
      } else {
        return "NA";
      }
    }
  }
  return {
    title: cahSrc.estNetCost,
    subtitle: cahSrc.netUoiCost,
    data: getData(cahSrc, getCAHData(cahSrc)),
  };
};
/**
 * @param {CAHProduct|PSPackage|PSAlternative} doc
 * @param {object} data
 * @returns {Data}
 */
const getData = (doc, data) => {
  return {
    lastUpdated: doc.lastUpdated,
    data,
  };
};
/**
 * @param {import("../cah/cahProduct").CAHProduct} cahProduct
 * @returns {object}
 */
const getCAHData = (cahProduct) => {
  return {
    brandName: interpretCAHData(cahProduct.brandName),
    amu: cahProduct.amu,
    name: cahProduct.name,
    mfr: cahProduct.mfr,
    cin: cahProduct.cin,
    ndc: cahProduct.ndc,
    contract: cahProduct.contract,
    stockStatus: cahProduct.stockStatus,
    stock: cahProduct.stock,
    avlAlertUpdated: cahProduct.avlAlertUpdated,
    avlAlertExpected: cahProduct.avlAlertExpected,
    avlAlertAddMsg: cahProduct.avlAlertAddMsg,
    rebateEligible: cahProduct.rebateEligible,
    returnable: cahProduct.returnable,
    histLow: cahProduct.histLow,
    lastOrdered: cahProduct.lastOrdered,
    lastCost: cahProduct.lastCost,
    lastSFDCDate: cahProduct.lastSFDCDate,
    lastSFDCCost: cahProduct.lastSFDCCost,
  };
};
/**
 * @param {import("../ps/psPackage").PSPackage} psPackage
 * @returns {object}
 */
const getPSPkgData = (psPackage) => {
  return {
    description: psPackage.description,
    ndc: hyphenateNDC11(psPackage.ndc),
    manufacturer: psPackage.manufacturer,
    pkgPrice: psPackage.pkgPrice,
    unitPrice: psPackage.unitPrice,
    qtyAvl: psPackage.qtyAvl,
    lotExpDate: psPackage.lotExpDate,
    wholesaler: psPackage.wholesaler,
    pkg: psPackage.pkg,
  };
};
/**
 * @param {DailyOrder} populatedDO
 * @returns {ColumnData}
 */
const getPSPkg = (populatedDO) => {
  const package = populatedDO.package.psPackage;
  if (!package) {
    return "PENDING";
  }
  if (!package.active) {
    return "NA";
  }
  return {
    title: package.pkgPrice,
    subtitle: package.unitPrice,
    data: getData(package, getPSPkgData(package)),
  };
};
/**
 * @param {DailyOrder} populatedDO
 * @returns {ColumnData}
 */
const getPSAlt = (populatedDO) => {
  const alt = populatedDO.package.alternative;
  const psAlt = alt?.psAlternative;
  if (!psAlt) {
    if (alt) {
      return "PENDING";
    } else {
      return "ERROR";
    }
  }
  if (!psAlt.active) {
    return "NA";
  }
  const index = selectPSAlt(populatedDO);
  return {
    title: psAlt.items[index].pkgPrice,
    subtitle: psAlt.items[index].unitPrice,
    data: getData(
      psAlt,
      psAlt.items.map((v) => getPSPkgData(v))
    ),
  };
};
/**
 * @param {DailyOrder} populatedDO
 * @returns {number}
 */
const selectPSAlt = (populatedDO) => {
  const package = populatedDO.package;
  const size = package.size;
  const ndc = package.ndc11.replaceAll("-", "");
  const items = package.alternative.psAlternative.items;
  let sameNDC = 0;
  let sameSize = 0;
  items.forEach((v, i) => {
    if (v.ndc === ndc) {
      sameNDC = i;
    }
    if (v.pkg === size) {
      sameSize = i;
    }
  });
  return sameNDC || sameSize || 0;
};
/**
 * @returns {Promise<void>}
 */
const scheduleUpdateSources = async () => {
  try {
    const dailyOrders = await dailyOrder.find({
      date: { $gte: getTodayStart() },
      status: "FILLED",
    });
    if (dailyOrders.length > 0) {
      for (let i = 0; i < dailyOrders.length; i++) {
        const pkg = await package.refreshPackage(dailyOrders[i].package);
        pkg && updateSources(pkg, true);
      }
    }
  } catch (e) {
    console.log(e);
  }
};
module.exports = {
  findDO,
  upsertDO,
  updateAltDOs,
  updateFilledItems,
  findDOByDateString,
  populateDO,
  generateData,
  scheduleUpdateSources,
};
