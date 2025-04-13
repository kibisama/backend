const dayjs = require("dayjs");
const dailyOrder = require("../../schemas/dailyOrder");
const item = require("../../schemas/item");
const package = require("./package");
const getSearchResults = require("../ps/getSearchResults");
const getProductDetails = require("../cah/getProductDetails");
const { interpretCAHData } = require("../cah/common");

/**
 * @typedef {dailyOrder.DailyOrder} DailyOrder
 * @typedef {import("./package").Package} Package
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
    return await updateFilledItems(_dailyOrder, package.gtin);
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
    const items = await findFilledItems(gtin);
    const date = items[items.length - 1].dateFilled;
    if (items?.length > 0) {
      const updateParam = createUpdateParam();
      updateParam.$set = { date };
      updateParam.$addToSet = { items: items.map((v) => v._id) };
      return await dailyOrder.findOneAndUpdate({ _id: dO._id }, updateParam, {
        new: true,
      });
    }
    return dO;
  } catch (e) {
    console.log(e);
  }
};
/**
 * @param {Package} pkg
 * @param {} [psOption]
 * @param {} [cahOption]
 * @returns {Promise<undefined>}
 */
const updateSources = (pkg) => {
  try {
    const callback = async () => {
      updateDO(await package.updatePackage(pkg));
    };
    getSearchResults(pkg, { callback });
    getProductDetails(pkg, { updateSource: true, callback });
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
    return await dailyOrder.findById(dO._id).populate({
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
    const dO = await populateDO(package);
    if (!dO) {
      return;
    }
    switch (dO.status) {
      case "FILLED":
        if (isSourceUpdated(dO)) {
          //
        } else {
          return;
        }
      case "UPDATED":
      default:
    }
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
      if (source && isNew(source.lastUpdated)) {
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
 * @property {string} lastUpdated
 * @property {object|"PENDING"} data
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
  return { title: getName(populatedDO), subtitle: getMfrName(populatedDO) };
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
  const name = package.cahProduct.name;
  if (name) {
    return name;
  }
  const description = package.psPackage.description;
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
 * @returns {string}
 */
const getQty = (populatedDO) => {
  return { title: populatedDO.items.length.toString() };
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
    data: getCAHData(cahPrd),
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
        if (alt.genAlt?.cahProduct) {
          // tooltip generic
          return { title: "BRAND*", data: getCAHData(cahPrd) };
        } else {
          return { title: "BRNAD" };
        }
      } else {
        return "NA";
      }
    }
  } else {
    //
  }
  // return { title: cahPrd.estNetCost, subtitle: cahPrd.netUoiCost, data: {} };
};
/**
 * @param {import("../cah/cahProduct").CAHProduct} cahProduct
 * @returns {Data}
 */
const getCAHData = (cahProduct) => {
  const {
    mfr,
    contract,
    stockStatus,
    stock,
    ndc,
    lastCost,
    lastOrdered,
    histLow,
    lastSFDCCost,
    lastSFDCDate,
    rebateEligible,
    returnable,
    avlAlertExpected,
    avlAlertUpdated,
    avlAlertAddMsg,
  } = cahProduct;
  /** @type {Data} */
  return {
    lastUpdated: dayjs(cahProduct.lastUpdated).format("MM/DD/YYYY HH:mm:ss"),
    data: { name: cahProduct.name, cin: cahProduct.cin },
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
  if (!package.acitve) {
    return "NA";
  }
  return { title: package.pkgPrice, subtitle: package.unitPrice, data: {} };
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
  return { title: psAlt.items[0].pkgPrice, subtitle: psAlt.items[0].unitPrice };
};
module.exports = {
  upsertDO,
  findDOByDateString,
  populateDO,
  generateData,
};
