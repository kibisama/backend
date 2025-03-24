const package = require("../../schemas/package");
const item = require("./item");
const alt = require("./alternative");
const getNDCStatus = require("../rxnav/getNDCStatus");
const getNDCProperties = require("../rxnav/getNDCProperties");
const { setOptionParameters } = require("../common");

const {
  gtinStringToNDCRegExp,
  ndcStringToGTINRegExp,
  ndcToNDC11,
} = require("../convert");

/**
 * @typedef {package.Package} Package
 * @typedef {typeof package.schema.obj} UpdateObj
 * @typedef {"gtin"|"ndc"} ArgType
 * @typedef {Parameters<package["findOne"]>["0"]} Filter
 */

/**
 * @param {ArgType} type
 * @return {Filter}
 */
const createBase = (arg, type) => {
  return { [type]: arg };
};
/**
 * @param {ArgType} type
 * @return {[Filter]}
 */
const createFilters = (arg, type) => {
  const filters = [createBase(arg, type)];
  switch (type) {
    case "gtin":
      filters.push({ ndc: { $regex: gtinStringToNDCRegExp(arg) } });
      break;
    case "ndc":
      filters.push({ gtin: { $regex: ndcStringToGTINRegExp(arg) } });
      break;
    default:
  }
  return filters;
};
/**
 * Finds a Package document.
 * @param {ArgType} type
 * @returns {Promise<Package|null>}
 */
const findPackage = async (arg, type) => {
  try {
    const filters = { $or: createFilters(arg, type) };
    return await package.findOne(filters);
  } catch (e) {
    console.log(e);
  }
};
/**
 * Creates a Package document.
 * @param {string} arg
 * @param {ArgType} type
 * @returns {Promise<Package|undefined>}
 */
const createPackage = async (arg, type) => {
  try {
    return await package.create(createBase(arg, type));
  } catch (e) {
    console.log(e);
  }
};
/**
 * Upserts a Package document.
 * @param {string} arg
 * @param {ArgType} type
 * @param {UpdateOption} option
 * @returns {Promise<Package|undefined>}
 */
const upsertPackage = async (arg, type, option) => {
  try {
    let pkg = await findPackage(arg, type);
    if (pkg === null) {
      pkg = await createPackage(arg, type);
    }
    updatePackage(pkg, option);
    return pkg;
  } catch (e) {
    console.log(e);
  }
};

/**
 * @typedef {object} UpdateOption
 * @property {boolean} force
 * @property {Function} callback
 */

/**
 * Determines if the Package document needs an update.
 * @param {Package} package
 * @returns {{rxNav: boolean, openFDA: boolean}}
 */
const needsUpdate = (package) => {
  let rxNav = false;
  let openFDA = false;
  //
  if (!package.rxcui) {
    rxNav = true;
  }
  return { rxNav, openFDA };
};
/**
 * Updates a Package document.
 * @param {Package} pkg
 * @param {UpdateOption} option
 * @returns {Promise<Package|undefined>}
 */
const updatePackage = async (pkg, option) => {
  try {
    /** @type {UpdateOption} */
    let _pkg = pkg;
    const defaultOption = { force: false };
    const { force, callback } = setOptionParameters(defaultOption, option);
    /** @type {Parameters<package["findOneAndUpdate"]>["1"]} */
    const update = { $set: {} };

    const { rxNav, openFDA } = force
      ? { rxNav: true, openFDA: true }
      : needsUpdate(_pkg);
    if (rxNav) {
      const rxNavData = await updateViaRxNav(_pkg);
      if (rxNavData) {
        Object.assign(update.$set, rxNavData);
      }
    }
    if (openFDA) {
      //
    }
    if (Object.keys(update.$set).length) {
      _pkg = await package.findOneAndUpdate({ _id: _pkg._id }, update, {
        new: true,
      });
    }
    if (_pkg.rxcui) {
      _pkg = (await linkWithAlternative(_pkg)) || _pkg;
    }
    if (callback instanceof Function) {
      callback(_pkg);
    }
    return _pkg;
  } catch (e) {
    console.log(e);
  }
};
/**
 * @param {Package} pkg
 * @returns {Promise<UpdateObj|undefined>}
 */
const updateViaRxNav = async (pkg) => {
  try {
    const [arg, type] = selectArg(pkg);
    const ndcStatus = await getNDCStatus(arg, type);
    if (!ndcStatus) {
      return;
    }
    const { ndc, rxcui } = ndcStatus;
    /** @type {UpdateObj} */
    let update = { ndc, ndc11: ndcToNDC11(ndc), rxcui };
    const output = await getNDCProperties(ndc, rxcui);
    if (output) {
      update = Object.assign(output, update);
    }
    return update;
  } catch (e) {
    console.log(e);
  }
};
/**
 * @param {Package} pkg
 * @returns {[string, ArgType]}
 */
const selectArg = (pkg) => {
  const result = [];
  switch (true) {
    case !!pkg.ndc:
      result.push(pkg.ndc);
      result.push("ndc");
      break;
    case !!pkg.gtin:
      result.push(pkg.gtin);
      result.push("gtin");
    default:
  }
  return result;
};
/**
 * @param {Package} pkg
 * @returns {Promise<|undefined>}
 */
const updateViaOpenFDA = async (pkg) => {
  try {
    //
  } catch (e) {
    console.log(e);
  }
};
/**
 * @param {Package} pkg
 * @returns {Promise<Package|undefined>}
 */
const linkWithAlternative = async (pkg) => {
  try {
    const { _id, rxcui } = pkg;
    const _alt = await alt.upsertAlternative(rxcui);
    if (_alt) {
      await _alt.updateOne({ $addToSet: { packages: _id } });
      return await package.findOneAndUpdate(
        { _id },
        { alternative: _alt._id },
        { new: true }
      );
    }
  } catch (e) {
    console.log(e);
  }
};
/**
 * Pulls an Item from the inventories.
 * @param {item.Item} item
 * @returns {Promise<Package|undefined>}
 */
const pullItem = async (item) => {
  try {
    const { gtin, _id } = item;
    const pkg = await findPackage(gtin, "gtin");
    if (pkg) {
      const _pkg = await package.findOneAndUpdate(
        { _id: pkg._id },
        { $pull: { inventories: _id } },
        { new: true }
      );
      if (_pkg.inventories.length === 0) {
        return await package.findOneAndUpdate(
          { _id: _pkg._id },
          { active: false },
          { new: true }
        );
      }
      return _pkg;
    }
  } catch (e) {
    console.log(e);
  }
};
/**
 * Adds an Item to the inventories.
 * @param {item.Item} item
 * @returns {Promise<Package|undefined>}
 */
const addItem = async (item) => {
  try {
    const { gtin, _id } = item;
    const pkg = await findPackage(gtin, "gtin");
    if (pkg) {
      return await package.findOneAndUpdate(
        { _id: pkg._id },
        { $addToSet: { inventories: _id }, active: true },
        { new: true }
      );
    }
  } catch (e) {
    console.log(e);
  }
};
/**
 * Updates the inventories.
 * @param {item.Item} item
 * @param {item.Mode} mode
 * @returns {Promise<Package|undefined>}
 */
const updateInventories = async (item, mode) => {
  try {
    if (mode === "FILL" || mode === "RETURN") {
      return await pullItem(item);
    } else if (mode === "RECEIVE" || mode === "REVERSE") {
      return await addItem(item);
    }
  } catch (e) {
    console.log(e);
  }
};
module.exports = {
  findPackage,
  upsertPackage,
  updateInventories,
  updatePackage,
};
