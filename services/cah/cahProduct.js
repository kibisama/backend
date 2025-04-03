const dayjs = require("dayjs");
const cahProduct = require("../../schemas/cahProduct");

/**
 * @typedef {cahProduct.CAHProduct} CAHProduct
 * @typedef {import("../inv/package").Package} Package
 * @typedef {Parameters<cahProduct["findOneAndUpdate"]>["0"]} Filter
 * @typedef {Parameters<cahProduct["findOneAndUpdate"]>["1"]} UpdateParam
 */

/**
 * @param {Date} date
 * @returns {boolean}
 */
const isOld = (date) => {
  return dayjs().startOf("day").isAfter(dayjs(date), "day");
};

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
  return { package: package._id };
};
/**
 * @param {Package} package
 * @returns {typeof cahProduct.schema.obj}
 */
const createBase = (package) => {
  return {
    lastUpdated: new Date(),
    package: package._id,
  };
};
/**
 * @param {Package} package
 * @returns {Promise<CAHProduct|undefined>}
 */
const findProduct = async (package) => {
  try {
    return (await cahProduct.findOne(createFilter(package))) ?? undefined;
  } catch (e) {
    console.log(e);
  }
};
/**
 * @param {Package} package
 * @returns {Promise<CAHProduct|undefined>}
 */
const createProduct = async (package) => {
  try {
    const product = await cahProduct.create(createBase(package));
    await package.updateOne({ cahProduct: product._id });
    return product;
  } catch (e) {
    console.log(e);
  }
};
/**
 * @param {Package} package
 * @returns {Promise<CAHProduct|undefined>}
 */
const voidProduct = async (package) => {
  try {
    const product = await findProduct(package);
    if (!product) {
      return await createProduct(package);
    } else if (product.active) {
      const updateParam = createUpdateParam();
      updateParam.$set.active = false;
      return await cahProduct.findOneAndUpdate(
        createFilter(package),
        updateParam,
        { new: true }
      );
    }
    return product;
  } catch (e) {
    console.log(e);
  }
};
/**
 * @param {Package} package
 * @returns {Promise<CAHProduct|undefined>}
 */
const upsertProduct = async (package) => {
  try {
    const product = await findProduct(package);
    if (!product) {
      return await createProduct(package);
    }
    return product;
  } catch (e) {
    console.log(e);
  }
};

/**
 * @param {Package} package
 * @returns {Promise<boolean|undefined>}
 */
const needsUpdate = async (package) => {
  try {
    if (package.cahProduct) {
      const populated = await package.populate([
        { path: "cahProduct", select: ["lastUpdated"] },
      ]);
      if (isOld(populated.psPackage.lastUpdated)) {
        return true;
      }
      return false;
    }
    return true;
  } catch (e) {
    console.log(e);
  }
};
/**
 * @param {Package} package
 * @param {import("./getProductDetails").Result} result
 * @returns {Promise<undefined>}
 */
const handleResult = async (package, result) => {
  try {
    const product = await upsertProduct(package);
    if (product) {
      const updateParam = createUpdateParam();
      if (result.stockStatus === "INELIGIBLE") {
        updateParam.$set.active = false;
      } else {
        updateParam.$set.active = true;
      }
      Object.assign(updateParam.$set, result);
      await product.updateOne(updateParam);
    }
  } catch (e) {
    console.log(e);
  }
};

module.exports = { voidProduct, needsUpdate, handleResult };
