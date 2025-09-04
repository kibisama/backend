const dayjs = require("dayjs");
const package = require("../../schemas/inv/package");
const item = require("./item");
const alt = require("./alternative");
const getNDCStatus = require("../rxnav/getNDCStatus");
const getNDCProperties = require("../rxnav/getNDCProperties");
const {
  gtinStringToNDCRegExp,
  gtinToNDC11RegExp,
  ndcStringToGTINRegExp,
  ndc11StringToGTINRegExp,
  ndc11StringToNDCRegExp,
  ndcToNDC11,
} = require("../convert");
const { calculateSize } = require("../cah/common");
const { isObjectIdOrHexString } = require("mongoose");
const { isAfterTodayStart } = require("../common");

/** Constants **/
const CREATE_CAHPRODUCT = true;

/**
 * @typedef {package.Package} Package
 * @typedef {typeof package.schema.obj} PackageSchema
 * @typedef {"gtin"|"ndc"|"ndc11"} ArgType
 * @typedef {Parameters<package["findOne"]>["0"]} Filter
 * @typedef {import("mongoose").ObjectId} ObjectId
 * @typedef {item.Item} Item
 */

/**
 * @param {string} arg
 * @param {ArgType} type
 * @return {Filter}
 */
const createFilter = (arg, type) => {
  return { [type]: arg };
};
/**
 * @param {string} arg
 * @param {ArgType} type
 * @return {Filter}
 */
const createCrossFilter = (arg, type) => {
  const filters = [];
  switch (type) {
    case "gtin":
      filters[0] = { ndc: { $regex: gtinStringToNDCRegExp(arg) } };
      filters[1] = { ndc11: { $regex: gtinToNDC11RegExp(arg) } };
      break;
    case "ndc":
      filters[0] = { gtin: { $regex: ndcStringToGTINRegExp(arg) } };
      filters[1] = { ndc11: ndcToNDC11(arg) };
      break;
    case "ndc11":
      filters[0] = { gtin: { $regex: ndc11StringToGTINRegExp(arg) } };
      filters[1] = { ndc: { $regex: ndc11StringToNDCRegExp(arg) } };
      break;
    default:
  }
  return { $or: filters };
};

/**
 * Upserts a Package document. Voids if a conflicting document
 * @param {string} arg
 * @param {ArgType} type
 * @returns {Promise<Package|undefined>}
 */
exports.upsertPackage = async (arg, type) => {
  try {
    let pkg = await package.findOne(createFilter(arg, type));
    if (!pkg) {
      const crossPackage = await package.findOne(createCrossFilter(arg, type));
      if (
        crossPackage === null ||
        (crossPackage[type] && crossPackage[type] !== arg)
      ) {
        pkg = await package.create(createFilter(arg, type));
      }
    }
    if (!pkg) {
      return;
    } else {
      exports.updatePackage(pkg);
      return pkg;
    }
  } catch (e) {
    console.error(e);
  }
};

/**
 * Updates the inventories.
 * @param {Item} item
 * @param {item.Mode} mode
 * @param {package.Package} [pkg]
 * @returns {Promise<Package|undefined>}
 */
exports.updateInventories = async (item, mode, pkg) => {
  try {
    if (mode === "FILL" || mode === "RETURN") {
      return await pullItem(item, pkg);
    } else if (mode === "RECEIVE" || mode === "REVERSE") {
      return await addItem(item, pkg);
    }
  } catch (e) {
    console.error(e);
  }
};
/**
 * Pulls an Item from the inventories.
 * @param {Item} item
 * @param {package.Package} [pkg]
 * @returns {Promise<Package|undefined>}
 */
const pullItem = async (item, pkg) => {
  try {
    const { gtin, _id } = item;
    var pkg = pkg || (await package.findOne(createFilter(gtin, "gtin")));
    if (pkg) {
      const _pkg = await package.findByIdAndUpdate(
        pkg._id,
        { $pull: { inventories: _id } },
        { new: true }
      );
      if (_pkg.inventories.length === 0) {
        await _pkg.updateOne({ $set: { active: false } });
      }
      return _pkg;
    }
  } catch (e) {
    console.error(e);
  }
};
/**
 * Adds an Item to the inventories.
 * @param {Item} item
 * @param {package.Package} [pkg]
 * @returns {Promise<Package|undefined>}
 */
const addItem = async (item, pkg) => {
  try {
    const { gtin, _id } = item;
    var pkg = pkg || (await package.findOne(createFilter(gtin, "gtin")));
    if (pkg) {
      return await package.findByIdAndUpdate(
        pkg._id,
        { $addToSet: { inventories: _id }, $set: { active: true } },
        { new: true }
      );
    }
  } catch (e) {
    console.error(e);
  }
};

/**
 * Refreshes a Package documnet.
 * @param {Package|ObjectId} pkg
 * @returns {Promise<Package|undefined>}
 */
const refreshPackage = async (pkg) => {
  try {
    if (isObjectIdOrHexString(pkg)) {
      return await package.findById(pkg);
    }
    return await package.findById(pkg._id);
  } catch (e) {
    console.error(e);
  }
};

/**
 * @typedef {object} UpdateOption
 * @property {boolean} [refresh]
 * @property {boolean} [force]
 * @property {Function} [callback]
 */

/**
 * Updates a Package document
 * @param {Package} pkg
 * @param {UpdateOption} [option]
 * @returns {Promise<any>}
 */
exports.updatePackage = async (pkg, option = {}) => {
  try {
    const { refresh, force, callback } = option;
    const _pkg = refresh ? await refreshPackage(pkg) : pkg;
    if (!_pkg) {
      return;
    }
    let {
      _id,
      lastUpdated,
      rxcui,
      ndc11,
      mfr,
      mfrName,
      alternative,
      ndc,
      cahProduct,
      name,
    } = _pkg;
    if (!force && lastUpdated && isAfterTodayStart(lastUpdated)) {
      return;
    }
    await _pkg.updateOne({ $set: { lastUpdated: new Date() } });
    const [arg, type] = selectArg(_pkg);
    if (force || !rxcui || !ndc11) {
      const ndcStatus = await getNDCStatus(arg, type);
      if (ndcStatus) {
        const { rxcui: _rxcui, ndc11: _ndc11 } = ndcStatus;
        rxcui = _rxcui;
        ndc11 = _ndc11;
        await _pkg.updateOne({ $set: { rxcui, ndc11 } });
      } else if (!rxcui) {
        return;
      }
    }
    if (force || !mfr || !ndc) {
      const ndcProperties = await getNDCProperties(ndc11, rxcui);
      if (ndcProperties) {
        mfr = ndcProperties.mfr;
        await _pkg.updateOne({ $set: ndcProperties });
      }
    }
    if (mfr && (force || !mfrName)) {
      if (!_pkg.mfr) {
        _pkg.mfr = mfr;
      }
      await updateMfrName(_pkg);
    }
    if (force || !alternative) {
      if (!_pkg.rxcui) {
        _pkg.rxcui = rxcui;
      }
      await linkWithAlternative(_pkg, {
        callback: async () => exports.updateName(await refreshPackage(_pkg)),
      });
    }
    if (CREATE_CAHPRODUCT) {
      // upsert cahProduct
      // callback update size
      // if (!cahProduct) {
      //   await updateOne
      // }
    }
    if (callback instanceof Function) {
      return callback(await refreshPackage(_pkg));
    }
  } catch (e) {
    console.error(e);
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
 * @param {Package} pkg
 * @returns {Promise<Awaited<ReturnType<Package["updateOne"]>>|undefined>}
 */
const updateMfrName = async (pkg) => {
  try {
    const mfr = pkg.mfr;
    let mfrName = "";
    const match = mfr.match(/[^\s,]+/g);
    if (match) {
      if (match[0].match(/[a-zA-Z0-9]{3,}/g)) {
        mfrName = match[0];
      } else {
        mfrName = mfr.substring(0, mfr.indexOf(match[1])) + match[1];
      }
    } else {
      mfrName = mfr;
    }
    mfrName = mfrName.toUpperCase();
    return await pkg.updateOne({ $set: { mfrName } });
  } catch (e) {
    console.error(e);
  }
};
/**
 * This upserts an Alternative document.
 * @param {Package} pkg
 * @param {alt.UpdateOption} [option]
 * @returns {Promise<Awaited<ReturnType<Package["updateOne"]>>|undefined>}
 */
const linkWithAlternative = async (pkg, option) => {
  try {
    const { _id, rxcui, alternative } = pkg;
    const _alt = await alt.upsertAlternative(rxcui, option);
    if (_alt && !alternative?.equals(_alt._id)) {
      await _alt.updateOne({ $addToSet: { packages: _id } });
      return await pkg.updateOne({ $set: { alternative: _alt._id } });
    }
  } catch (e) {
    console.error(e);
  }
};

/**
 * @param {Package} pkg
 * @param {string} [name]
 * @returns {Promise<Awaited<ReturnType<Package["updateOne"]>>|undefined>}
 */
exports.updateName = async (pkg, name) => {
  try {
    var name = name || "";
    if (!name) {
      if (!pkg.alternative) {
        return;
      }
      const { size, alternative } = await pkg.populate("alternative");
      const { defaultName } = alternative;
      if (!defaultName) {
        return;
      }
      name += defaultName;
      size && (name += ` (${size})`);
    }
    return await pkg.updateOne({ $set: { name } });
  } catch (e) {
    console.error(e);
  }
};

// /**
//  * @param {Package} pkg
//  * @returns {Promise<Package|undefined>}
//  */
// const updateSizeViaCAH = async (pkg) => {
//   try {
//     const { _id, cahProduct } = await pkg.populate("cahProduct");
//     if (cahProduct) {
//       const { size, ndc } = cahProduct;
//       if (size) {
//         const _size = calculateSize(size);
//         if (_size) {
//           return await package.findByIdAndUpdate(
//             _id,
//             { $set: { size: _size } },
//             { new: true }
//           );
//         }
//       }
//     }
//   } catch (e) {
//     console.log(e);
//   }
// };

// /**
//  * @param {Package} pkg
//  * @returns {number}
//  */
// const getNumberInStock = (pkg) => {
//   return pkg.inventories.length;
// };
// /**
//  * @typedef {object} Stock
//  * @property {string} ndc
//  * @property {string} [mfr]
//  * @property {string} [size]
//  * @property {string} stock
//  * @param {Package} pkg
//  * @returns {Promise<Stock|undefined>}
//  */
// const getStock = (pkg) => {
//   return {
//     ndc: pkg.ndc11 || pkg.ndc || pkg.gtin,
//     mfr: pkg.mfrName || pkg.mfr,
//     size: pkg.size,
//     stock: getNumberInStock(pkg).toString(),
//   };
// };
// /**
//  * @param {Package} pkg
//  * @param {boolean} [active]
//  * @returns {Promise<[Package]|undefined>}
//  */
// const findAltPackages = async (pkg, active) => {
//   try {
//     if (pkg.alternative) {
//       const filter = {
//         _id: { $ne: pkg._id },
//         alternative: pkg.alternative,
//       };
//       if (typeof active === "boolean") {
//         filter.active = active;
//       }
//       return await package.find(filter);
//     }
//   } catch (e) {
//     console.log(e);
//   }
// };
// /**
//  * @param {Package} pkg
//  * @returns {Promise<[Stock]|undefined>}
//  */
// const getAltStocks = async (pkg) => {
//   try {
//     const altPkgs = await findAltPackages(pkg, true);
//     if (altPkgs) {
//       return altPkgs.map((v) => getStock(v));
//     }
//   } catch (e) {
//     console.log(e);
//   }
// };
// /**
//  *
//  */
// const findIncompletePackage = async () => {
//   try {
//     const packages = await package.find({
//       $or: [{ ndc: { $exists: false } }, { ndc11: { $exists: false } }],
//     });
//   } catch (e) {
//     console.log(e);
//   }
// };
// /**
//  * @param {{gtin: string, ndc11: string}} arg
//  * @param {UpdateOption} [option]
//  * @returns {Promise<Package|null|undefined>}
//  */
// const crossUpsertPackage = async (arg, option) => {
//   try {
//     const { gtin, ndc11 } = arg;
//     let pkg = await package.findOne({ $or: [{ gtin }, { ndc11 }] });
//     if (pkg === null) {
//       pkg = await package.create(arg);
//     }
//     pkg && updatePackage(pkg, option);
//     return pkg;
//   } catch (e) {
//     console.log(e);
//   }
// };
// /**
//  * @param {Package} pkg
//  * @param {string} gtin
//  * @returns {Promise<void>}
//  */
// const updateGTIN = async (pkg, gtin) => {
//   try {
//     await pkg.updateOne({ gtin });
//     updatePackage(pkg);
//   } catch (e) {
//     console.log(e);
//   }
// };
