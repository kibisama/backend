// const dayjs = require("dayjs");
const PsPackage = require("../../schemas/ps/psPackage");
const { isAfterTodayStart } = require("../common");
const getSearchResults = require("./getSearchResults");
// const { refreshPackage } = require("../inv/package");

/**
 * @typedef {import("mongoose").ObjectId} ObjectId
 * @typedef {PsPackage.PSPackage} PsPackage
 * @typedef {import("../inv/package").Package} Package
 * @typedef {Parameters<PsPackage["findOneAndUpdate"]>["0"]} Filter
 * @typedef {Parameters<PsPackage["findOneAndUpdate"]>["1"]} UpdateParam
 */

// /**
//  * @param {Package} package
//  * @returns {Promise<PSPackage|undefined>}
//  */
// const findItem = async (package) => {
//   try {
//     return (await psPackage.findOne(createFilter(package))) ?? undefined;
//   } catch (e) {
//     console.log(e);
//   }
// };
// /**
//  * @param {Package} package
//  * @returns {Promise<PSPackage|undefined>}
//  */
// const createItem = async (package) => {
//   try {
//     const item = await psPackage.create(createBase(package));
//     await package.updateOne({ psPackage: item._id });
//     return item;
//   } catch (e) {
//     console.log(e);
//   }
// };
// /**
//  * @param {Package} package
//  * @returns {Promise<PSPackage|undefined>}
//  */
// const voidItem = async (package) => {
//   try {
//     const item = await findItem(package);
//     if (!item) {
//       return await createItem(package);
//     }
//     const updateParam = createUpdateParam();
//     updateParam.$set.active = false;
//     return await psPackage.findOneAndUpdate(
//       createFilter(package),
//       updateParam,
//       { new: true }
//     );
//     return item;
//   } catch (e) {
//     console.log(e);
//   }
// };
/**
 * @param {Package|ObjectId} package
 * @returns {Promise<PsPackage|undefined>}
 */
exports.upsertPsPackage = async (package) => {
  try {
    const psPkg = await PsPackage.findOneAndUpdate(
      { package },
      {},
      { new: true, upsert: true }
    );
    // update
    return psPkg;
  } catch (e) {
    console.error(e);
  }
};
/**
 * Refreshes a PsPackage documnet.
 * @param {PsPackage|ObjectId} psPkg
 * @returns {Promise<PsPackage|undefined>}
 */
exports.refreshProduct = async (psPkg) => {
  try {
    return await PsPackage.findById(psPkg);
  } catch (e) {
    console.error(e);
  }
};

/**
 * @param {PsPackage} psPkg
 * @returns {boolean}
 */
const needsUpdate = (psPkg) => {
  const { lastRequested } = psPkg;
  if (!lastRequested || isAfterTodayStart(lastRequested)) {
    return true;
  }
  return false;
};

/**
 * @typedef {object} UpdateOption
 * @property {boolean} [force]
 * @property {Function} [callback]
 */

/**
 * Request a puppet to update a CAHProduct.
 * @param {PsPackage} psPkg
 * @param {UpdateOption} option
 * @returns {void}
 */
exports.updatePsPackage = async (psPkg, option = {}) => {
  try {
    // (option.force || needsUpdate(psPkg)) &&
    //   getSearchResults(psPkg, (data, psPkg) =>
    //     updateProductCallback(data, psPkg, option)
    //   ) &&
    //   (await psPkg.updateOne({ $set: { lastRequested: new Date() } }));
  } catch (e) {
    console.error(e);
  }
};
/**
 * @param {getProductDetails.Data|null} data
 * @param {CAHProduct} psPkg
 * @param {UpdateOption} option
 * @returns {void}
 */
const updateProductCallback = async (data, psPkg, option) => {};

// /**
//  * @param {Package} package
//  * @param {import("./getSearchResults").Result} result
//  * @returns {Promise<undefined>}
//  */
// const handleResult = async (package, result) => {
//   try {
//     const item = await upsertItem(package);
//     if (item) {
//       const updateParam = createUpdateParam();
//       updateParam.$set.active = true;
//       Object.assign(updateParam.$set, result);
//       await item.updateOne(updateParam);
//     }
//   } catch (e) {
//     console.log(e);
//   }
// };

// module.exports = { voidItem, handleResult, needsUpdate };
