const package = require("../../schemas/package");
const item = require("./item");
const alt = require("./alternative");
const getNDCStatus = require("../rxnav/getNDCStatus");
const getNDCProperties = require("../rxnav/getNDCProperties");
const { setOptionParameters } = require("../common");
const {
  gtinStringToNDCRegExp,
  gtinToNDC11RegExp,
  ndcStringToGTINRegExp,
  ndc11StringToGTINRegExp,
  ndc11StringToNDCRegExp,
  ndcToNDC11,
} = require("../convert");
const { calculateSize } = require("../cah/common");

/**
 * @typedef {package.Package} Package
 * @typedef {typeof package.schema.obj} UpdateObj
 * @typedef {"gtin"|"ndc"|"ndc11"} ArgType
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
      filters[1] = { ndc: { $regex: gtinStringToNDCRegExp(arg) } };
      filters[2] = { ndc11: { $regex: gtinToNDC11RegExp(arg) } };
      break;
    case "ndc":
      filters[1] = { gtin: { $regex: ndcStringToGTINRegExp(arg) } };
      filters[2] = { ndc11: ndcToNDC11(arg) };
      break;
    case "ndc11":
      filters[1] = { gtin: { $regex: ndc11StringToGTINRegExp(arg) } };
      filters[2] = { ndc: { $regex: ndc11StringToNDCRegExp(arg) } };
      break;
    default:
  }
  return filters;
};
/**
 * Finds a Package document.
 * @param {ArgType} type
 * @returns {Promise<Package|null|undefined>}
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
 * Finds a Package document by ObjectId.
 * @param {import("mongoose").ObjectId} id
 * @returns {Promise<Package|null|undefined>}
 */
const findPackageById = async (id) => {
  try {
    return await package.findById(id);
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
 * @param {UpdateOption} [option]
 * @returns {Promise<Package|undefined>}
 */
const upsertPackage = async (arg, type, option) => {
  try {
    let pkg = await findPackage(arg, type);
    if (pkg === null) {
      pkg = await createPackage(arg, type);
    }
    if (pkg) {
      updatePackage(pkg, option);
    }
    return pkg;
  } catch (e) {
    console.log(e);
  }
};

/**
 * @typedef {object} UpdateOption
 * @property {boolean} [force]
 * @property {Function} [callback]
 */

/**
 * Determines if the Package document needs an update.
 * @param {Package} package
 * @returns {{rxNav: boolean, cah: boolean, name: boolean, mfrName: boolean, alt: boolean}}
 */
const needsUpdate = (package) => {
  let rxNav = false;
  let cah = false;
  let name = false;
  let mfrName = false;
  let alt = false;
  if (!package.rxcui) {
    rxNav = true;
  }
  if (!package.size) {
    cah = true;
  }
  if (!package.name) {
    name = true;
  }
  if (!package.mfrName) {
    mfrName = true;
  }
  if (!package.alternative) {
    alt = true;
  }
  return { rxNav, cah, name, mfrName, alt };
};
/**
 * Updates a Package document.
 * @param {Package} pkg
 * @param {UpdateOption} [option]
 * @returns {Promise<Package|undefined>}
 */
const updatePackage = async (pkg, option) => {
  try {
    let _pkg = await findPackageById(pkg._id);
    /** @type {UpdateOption} */
    const defaultOption = { force: false };
    const { force, callback } = setOptionParameters(defaultOption, option);
    /** @type {Parameters<package["findOneAndUpdate"]>["1"]} */
    const update = { $set: {} };
    const [arg, type] = selectArg(_pkg);
    const { rxNav, cah, name, mfrName, alt } = force
      ? { rxNav: true, cah: true, name: true, mfrName: true, alt: true }
      : needsUpdate(_pkg);
    if (rxNav) {
      const rxNavData = await updateViaRxNav(arg, type);
      if (rxNavData) {
        Object.assign(update.$set, rxNavData);
      }
    }
    if (Object.keys(update.$set).length) {
      _pkg = await package.findOneAndUpdate({ _id: _pkg._id }, update, {
        new: true,
      });
    }
    if (alt) {
      _pkg = (await linkWithAlternative(_pkg)) || _pkg;
    }
    if (cah) {
      _pkg = (await updateViaCAH(_pkg)) || _pkg;
    }
    if (name) {
      _pkg = (await setName(_pkg)) || _pkg;
    }
    if (mfrName) {
      _pkg = (await setMfrName(_pkg)) || _pkg;
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
 * @param {Package} arg
 * @param {ArgType} type
 * @returns {Promise<UpdateObj|undefined>}
 */
const updateViaRxNav = async (arg, type) => {
  try {
    const ndcStatus = await getNDCStatus(arg, type);
    if (!ndcStatus) {
      return;
    }
    const { ndc, ndc11, rxcui } = ndcStatus;
    /** @type {UpdateObj} */
    let update = { ndc, ndc11, rxcui };
    if (ndc11) {
      const output = await getNDCProperties(ndc11, rxcui);
      if (output) {
        update = Object.assign(output, update);
      }
    }
    return update;
  } catch (e) {
    console.log(e);
  }
};
/**
 * @param {Package} pkg
 * @returns {Promise<Package|undefined>}
 */
const updateViaCAH = async (pkg) => {
  try {
    const { _id, cahProduct } = await pkg.populate("cahProduct");
    if (cahProduct) {
      const { size } = cahProduct;
      if (size) {
        const _size = calculateSize(size);
        if (_size) {
          return await package.findByIdAndUpdate(
            _id,
            { $set: { size: _size } },
            { new: true }
          );
        }
      }
    }
  } catch (e) {
    console.log(e);
  }
};
/**
 * @param {Package} pkg
 * @returns {Promise<Package|undefined>}
 */
const setName = async (pkg) => {
  try {
    const { _id, size, alternative } = await pkg.populate("alternative");
    if (size && alternative?.defaultName) {
      return await package.findByIdAndUpdate(
        _id,
        {
          $set: { name: `${alternative.defaultName} (${size})` },
        },
        { new: true }
      );
    }
  } catch (e) {
    console.log(e);
  }
};
/**
 * @param {Package} pkg
 * @returns {Promise<Package|undefined>}
 */
const setMfrName = async (pkg) => {
  try {
    const { _id, mfr } = pkg;
    if (mfr) {
      let mfrName = "";
      const match = mfr.match(/([^\s,]+)/);
      if (match) {
        if (match[0].length < 10) {
          mfrName = match[0];
        } else {
          mfrName = mfr.substring(0, 9);
        }
      } else {
        mfrName = mfr;
      }
      return await package.findByIdAndUpdate(
        _id,
        { $set: { mfrName } },
        { new: true }
      );
    }
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
      result[0] = pkg.ndc;
      result[1] = "ndc";
      break;
    case !!pkg.ndc11:
      result[0] = pkg.ndc11;
      result[1] = "ndc11";
      break;
    case !!pkg.gtin:
      result[0] = pkg.gtin;
      result[1] = "gtin";
    default:
  }
  return result;
};

/**
 * This upserts an Alternative document.
 * @param {Package} pkg
 * @returns {Promise<Package|undefined>}
 */
const linkWithAlternative = async (pkg) => {
  try {
    const { _id, rxcui, alternative } = pkg;
    if (!rxcui) {
      return;
    }
    const _alt = await alt.upsertAlternative(rxcui);
    if (_alt && !alternative?.equals(_alt._id)) {
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
