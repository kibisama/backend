const package = require("../../schemas/inv/package");
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
const { isObjectIdOrHexString } = require("mongoose");

/**
 * @typedef {package.Package} Package
 * @typedef {typeof package.schema.obj} UpdateObj
 * @typedef {"gtin"|"ndc"|"ndc11"} ArgType either gtin or ndc11 preferred
 * @typedef {Parameters<package["findOne"]>["0"]} Filter
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
    const pkg = await package.findOne(createFilter(arg, type));
    if (pkg) {
      return pkg;
    } else {
      const crossPackage = await package.findOne(createCrossFilter(arg, type));
      if (
        crossPackage === null ||
        (crossPackage[type] && crossPackage[type] !== arg)
      ) {
        return await package.create(createFilter(arg, type));
      }
    }
  } catch (e) {
    console.error(e);
  }
};

/**
 * Updates the inventories.
 * @param {item.Item} item
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
 * @param {item.Item} item
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
        await _pkg.updateOne({ active: false });
      }
      return _pkg;
    }
  } catch (e) {
    console.error(e);
  }
};
/**
 * Adds an Item to the inventories.
 * @param {item.Item} item
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
        { $addToSet: { inventories: _id }, active: true },
        { new: true }
      );
    }
  } catch (e) {
    console.error(e);
  }
};

// /**
//  * Refreshes a Package documnet.
//  * @param {Package|import("mongoose").ObjectId} pkg
//  * @returns {Promise<Package|undefined>}
//  */
// const refreshPackage = async (pkg) => {
//   try {
//     if (isObjectIdOrHexString(pkg)) {
//       return await package.findById(pkg);
//     }
//     return await package.findById(pkg._id);
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
// /**
//  * Merges Package documents.
//  * @param {Package} pkg1
//  * @param {Package} pkg2
//  * @returns {Promise<Package|undefined>}
//  */
// const mergePackage = async (pkg1, pkg2) => {
//   try {
//     //
//   } catch (e) {
//     console.log(e);
//   }
// };

// /**
//  * @typedef {object} UpdateOption
//  * @property {boolean} [force]
//  * @property {Function} [callback]
//  */

// /**
//  * Determines if the Package document needs an update.
//  * @param {Package} package
//  * @returns {{rxNav: boolean, cah: boolean, name: boolean, mfrName: boolean, alt: boolean}}
//  */
// const needsUpdate = (package) => {
//   let rxNav = false;
//   let cah = false;
//   let name = false;
//   let mfrName = false;
//   let alt = false;
//   if (!package.rxcui) {
//     rxNav = true;
//   }
//   if (!package.size) {
//     cah = true;
//   }
//   if (!package.name) {
//     name = true;
//   }
//   if (!package.mfrName) {
//     mfrName = true;
//   }
//   if (!package.alternative) {
//     alt = true;
//   }
//   return { rxNav, cah, name, mfrName, alt };
// };
// /**
//  * Updates a Package document.
//  * @param {Package} pkg
//  * @param {UpdateOption} [option]
//  * @returns {Promise<Package|undefined>}
//  */
// const updatePackage = async (pkg, option) => {
//   try {
//     let _pkg = await refreshPackage(pkg);
//     /** @type {UpdateOption} */
//     const defaultOption = { force: false };
//     const { force, callback } = setOptionParameters(defaultOption, option);
//     /** @type {Parameters<package["findOneAndUpdate"]>["1"]} */
//     const update = { $set: {} };
//     const [arg, type] = selectArg(_pkg);
//     const { rxNav, cah, name, mfrName, alt } = force
//       ? { rxNav: true, cah: true, name: true, mfrName: true, alt: true }
//       : needsUpdate(_pkg);
//     if (rxNav) {
//       const rxNavData = await updateViaRxNav(arg, type);
//       if (rxNavData) {
//         Object.assign(update.$set, rxNavData);
//       }
//     }
//     if (Object.keys(update.$set).length) {
//       _pkg = await package.findOneAndUpdate({ _id: _pkg._id }, update, {
//         new: true,
//       });
//     }
//     if (alt) {
//       _pkg = (await linkWithAlternative(_pkg)) || _pkg;
//     }
//     if (cah) {
//       _pkg = (await updateSizeViaCAH(_pkg)) || _pkg;
//     }
//     if (name) {
//       _pkg = (await setName(_pkg)) || _pkg;
//     }
//     if (mfrName) {
//       _pkg = (await setMfrName(_pkg)) || _pkg;
//     }
//     if (!_pkg.ndc || !_pkg.ndc11) {
//       //
//     }
//     if (callback instanceof Function) {
//       callback(_pkg);
//     }
//     return _pkg;
//   } catch (e) {
//     console.log(e);
//   }
// };
// /**
//  * @param {string} arg
//  * @param {ArgType} type
//  * @returns {Promise<UpdateObj|undefined>}
//  */
// const updateViaRxNav = async (arg, type) => {
//   try {
//     const ndcStatus = await getNDCStatus(arg, type);
//     if (!ndcStatus) {
//       return;
//     }
//     const { ndc, ndc11, rxcui } = ndcStatus;
//     /** @type {UpdateObj} */
//     let update = {};
//     ndc && (update.ndc = ndc);
//     ndc11 && (update.ndc11 = ndc11);
//     rxcui && (update.rxcui = rxcui);
//     if (ndc11) {
//       const output = await getNDCProperties(ndc11, rxcui);
//       if (output) {
//         update = Object.assign(output, update);
//       }
//     }
//     return update;
//   } catch (e) {
//     console.log(e);
//   }
// };
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
//  * @returns {Promise<Package|undefined>}
//  */
// const setName = async (pkg) => {
//   try {
//     const { _id, size, alternative } = await pkg.populate("alternative");
//     if (size && alternative?.defaultName) {
//       return await package.findByIdAndUpdate(
//         _id,
//         {
//           $set: { name: `${alternative.defaultName.toUpperCase()} (${size})` },
//         },
//         { new: true }
//       );
//     }
//   } catch (e) {
//     console.log(e);
//   }
// };
// /**
//  * @param {Package} pkg
//  * @returns {Promise<Package|undefined>}
//  */
// const setMfrName = async (pkg) => {
//   try {
//     const { _id, mfr } = pkg;
//     if (mfr) {
//       let mfrName = "";
//       const match = mfr.match(/[^\s,]+/g);
//       if (match) {
//         if (match[0].match(/[a-zA-Z0-9]{3,}/g)) {
//           mfrName = match[0];
//         } else {
//           mfrName = mfr.substring(0, mfr.indexOf(match[1])) + match[1];
//         }
//       } else {
//         mfrName = mfr;
//       }
//       mfrName = mfrName.toUpperCase();
//       return await package.findByIdAndUpdate(
//         _id,
//         { $set: { mfrName } },
//         { new: true }
//       );
//     }
//   } catch (e) {
//     console.log(e);
//   }
// };
// /**
//  * @param {Package} pkg
//  * @returns {[string, ArgType]}
//  */
// const selectArg = (pkg) => {
//   const result = [];
//   switch (true) {
//     case !!pkg.ndc:
//       result[0] = pkg.ndc;
//       result[1] = "ndc";
//       break;
//     case !!pkg.ndc11:
//       result[0] = pkg.ndc11;
//       result[1] = "ndc11";
//       break;
//     case !!pkg.gtin:
//       result[0] = pkg.gtin;
//       result[1] = "gtin";
//     default:
//   }
//   return result;
// };

// /**
//  * This upserts an Alternative document.
//  * @param {Package} pkg
//  * @returns {Promise<Package|undefined>}
//  */
// const linkWithAlternative = async (pkg) => {
//   try {
//     const { _id, rxcui, alternative } = pkg;
//     if (!rxcui) {
//       return;
//     }
//     const _alt = await alt.upsertAlternative(rxcui);
//     if (_alt && !alternative?.equals(_alt._id)) {
//       await _alt.updateOne({ $addToSet: { packages: _id } });
//       return await package.findOneAndUpdate(
//         { _id },
//         { alternative: _alt._id },
//         { new: true }
//       );
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
// module.exports = {
//   findPackage,
//   refreshPackage,
//   upsertPackage,
//   crossUpsertPackage,
//   updateInventories,
//   updatePackage,
//   updateGTIN,
//   getNumberInStock,
//   getStock,
//   getAltStocks,
//   findAltPackages,
// };
