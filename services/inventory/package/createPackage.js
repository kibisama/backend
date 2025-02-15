const { Package } = require("../../../schemas/inventory");

/**
 * Creates a Package document.
 * @param {string} arg
 * @param {string} type
 * @returns {Promise<Package|undefined>}
 */
module.exports = async (arg, type) => {
  try {
    let query = {};
    switch (type) {
      case "gtin":
        query.gtin = arg;
        break;
      case "ndc11":
        query.ndc11 = arg;
        break;
      default:
        return;
    }
    const result = await Package.findOne(query);
    if (result) {
      return result;
    } else {
      return await Package.create(query);
    }
  } catch (e) {
    console.log(e);
  }
};
