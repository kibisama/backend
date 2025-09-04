// const dayjs = require("dayjs");
const cahProduct = require("../../schemas/cahProduct");
// const { refreshPackage } = require("../inv/package");
// const {
//   interpretBooleanIcon,
//   interpretBooleanText,
//   interpretBooleanTextCaps,
//   isProductEligible,
// } = require("./common");

/**
 * @typedef {cahProduct.CAHProduct} CAHProduct
 * @typedef {import("../inv/package").Package} Package
 * @typedef {Parameters<cahProduct["findOneAndUpdate"]>["0"]} Filter
 * @typedef {Parameters<cahProduct["findOneAndUpdate"]>["1"]} UpdateParam
 */

// /**
//  * @param {Date} date
//  * @returns {boolean}
//  */
// const isOld = (date) => {
//   return dayjs().startOf("day").isAfter(dayjs(date), "day");
// };

// /**
//  * @returns {UpdateParam}
//  */
// const createUpdateParam = () => {
//   return { $set: { lastUpdated: new Date() } };
// };
/**
 * @param {Package} package
 * @returns {Filter}
 */
const createFilter = (package) => {
  return { package: package._id };
};
// /**
//  * @param {Package} package
//  * @returns {typeof cahProduct.schema.obj}
//  */
// const createBase = (package) => {
//   return {
//     lastUpdated: new Date(),
//     package: package._id,
//   };
// };
// /**
//  * @param {Package} package
//  * @returns {Promise<CAHProduct|undefined>}
//  */
// const findProduct = async (package) => {
//   try {
//     return (await cahProduct.findOne(createFilter(package))) ?? undefined;
//   } catch (e) {
//     console.log(e);
//   }
// };
// /**
//  * @param {Package} package
//  * @returns {Promise<CAHProduct|undefined>}
//  */
// const createProduct = async (package) => {
//   try {
//     const product = await cahProduct.create(createBase(package));
//     await package.updateOne({ cahProduct: product._id });
//     return product;
//   } catch (e) {
//     console.log(e);
//   }
// };
// /**
//  * @param {Package} package
//  * @returns {Promise<CAHProduct|undefined>}
//  */
// const voidProduct = async (package) => {
//   try {
//     const product = await findProduct(package);
//     if (!product) {
//       return await createProduct(package);
//     } else if (product.active) {
//       const updateParam = createUpdateParam();
//       updateParam.$set.active = false;
//       return await cahProduct.findOneAndUpdate(
//         createFilter(package),
//         updateParam,
//         { new: true }
//       );
//     }
//     return product;
//   } catch (e) {
//     console.log(e);
//   }
// };
// /**
//  * @param {Package} package
//  * @returns {Promise<CAHProduct|undefined>}
//  */
// const upsertProduct = async (package) => {
//   try {
//     const product = await findProduct(package);
//     if (!product) {
//       return await createProduct(package);
//     }
//     return product;
//   } catch (e) {
//     console.log(e);
//   }
// };

// /**
//  * @param {Package} pkg
//  * @returns {Promise<boolean|undefined>}
//  */
// const needsUpdate = async (pkg) => {
//   try {
//     const package = await refreshPackage(pkg);
//     if (package.cahProduct) {
//       const populated = await package.populate([
//         { path: "cahProduct", select: ["lastUpdated"] },
//       ]);
//       if (isOld(populated.cahProduct.lastUpdated)) {
//         return true;
//       }
//       return false;
//     }
//     return true;
//   } catch (e) {
//     console.log(e);
//   }
// };
// /**
//  * @param {Package} package
//  * @param {import("./getProductDetails").Result} result
//  * @returns {Promise<CAHProduct|undefined>}
//  */
// const handleResult = async (package, result) => {
//   try {
//     const product = await upsertProduct(package);
//     if (product) {
//       const updateParam = createUpdateParam();
//       const set = updateParam.$set;
//       Object.assign(updateParam.$set, result);
//       const { rx, refrigerated, serialized } = result;
//       set.active = isProductEligible(result.stockStatus);
//       set.rebateEligible = interpretBooleanIcon(result.rebateEligible);
//       set.returnable = interpretBooleanIcon(result.returnable);
//       set.rx = rx ? interpretBooleanText(rx) : undefined;
//       set.refrigerated = refrigerated
//         ? interpretBooleanText(refrigerated)
//         : undefined;
//       set.serialized = serialized
//         ? interpretBooleanTextCaps(serialized)
//         : serialized;
//       return await cahProduct.findOneAndUpdate(
//         { _id: product._id },
//         updateParam,
//         { new: true }
//       );
//     }
//   } catch (e) {
//     console.log(e);
//   }
// };

// module.exports = { voidProduct, needsUpdate, handleResult };
