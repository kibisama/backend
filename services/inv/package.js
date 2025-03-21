const package = require("../../schemas/package");
const item = require("./item");
const alt = require("./alternative");
const findRxcuiById = require("../rxnav/findRxcuiById");

const {
  gtinStringToNDCRegExp,
  ndcStringToGTINRegExp,
  ndcToNDC11,
} = require("../convert");

/**
 * @typedef {package.Package} Package
 * @typedef {"gtin"|"ndc"} ArgType
 * @typedef {Parameters<package["findOne"]>["0"]} Filter
 */

/**
 * @param {ArgType} type
 * @return {Filter}
 */
const createBaseFilter = (arg, type) => {
  return { [type]: arg };
};
/**
 * @param {ArgType} type
 * @return {[Filter]}
 */
const createFilters = (arg, type) => {
  const filters = [createBaseFilter(arg, type)];
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
    return await package.create(createBaseFilter(arg, type));
  } catch (e) {
    console.log(e);
  }
};
/**
 * Upserts a Package document.
 * @param {string} arg
 * @param {ArgType} type
 * @returns {Promise<Package|undefined>}
 */
const upsertPackage = async (arg, type) => {
  try {
    const pkg = await findPackage(arg, type);
    if (pkg === null) {
      return await createPackage(arg, type);
    }
    return pkg;
  } catch (e) {
    console.log(e);
  }
};

/**
 * Determines if the Package document needs an update.
 * @param {Package} package
 * @returns {[boolean, boolean]} openFDA data, RxNav data
 */
const needsUpdate = (package) => {
  let openFda = false;
  let rxNav = false;
  //
  if (!package.rxcui) {
    rxNav = true;
  }
  return [openFda, rxNav];
};
/**
 * Updates a Package document.
 * @param {Package} pkg
 * @param {Function} callback
 * @returns {Promise<Package>}
 */
const updatePackage = async (pkg, callback) => {
  try {
    /** @type {Package} */
    let currentPkg = pkg;
    /** @type {typeof package.schema.obj} */
    const update = {};
    if (needsUpdate(currentPkg)[0]) {
      //
    }
    if (needsUpdate(currentPkg)[1]) {
      const rxNavData = await updateViaRxNav(currentPkg);
      if (rxNavData) {
        Object.assign(update, rxNavData);
      }
    }
    if (Object.keys(update).length) {
      currentPkg = await package.findOneAndUpdate({ _id: pkg._id }, update, {
        new: true,
      });
    }
    if (currentPkg.rxcui) {
      const pkg = await linkWithAlternative(currentPkg);
      if (pkg) {
        currentPkg = pkg;
      }
    }
    if (callback instanceof Function) {
      callback(currentPkg);
    }
    return pkg;
  } catch (e) {
    console.log(e);
  }
};
/**
 * @param {Package} pkg
 * @returns {Promise<|undefined>}
 */
const updateViaRxNav = async (pkg) => {
  try {
    if (!pkg.rxcui) {
      const updatedPackage = await updateRxcui(pkg);
      if (!updatedPackage) {
        return;
      }
      return await updateViaRxNav(updatedPackage);
    }
    //
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
 * @returns {Promise<Package|undefined>}
 */
const updateRxcui = async (pkg) => {
  try {
    const [arg, type] = selectArg(pkg);
    const result = await findRxcuiById(arg, type);
    if (result) {
      const { ndc, rxcui } = result;
      if (type === "ndc") {
        if (arg !== ndc) {
          return;
        }
      }
      return await package.findOneAndUpdate(
        { _id: pkg._id },
        { ndc, ndc11: ndcToNDC11(ndc), rxcui },
        { new: true }
      );
    }
  } catch (e) {
    console.log(e);
  }
};
/**
 * @param {Package} pkg
 * @returns {Promise<>}
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
    const pkg = await package.findOneAndUpdate(
      { gtin },
      { $pull: { inventories: _id } },
      { new: true }
    );
    if (pkg.inventories.length === 0) {
      return pkg.updateOne({ active: false }, { new: true });
    }
    return pkg;
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
    return await package.findOneAndUpdate(
      { gtin },
      { $addToSet: { inventories: _id }, active: true },
      { new: true }
    );
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
