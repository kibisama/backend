const { Package } = require("../../../schemas/inventory");
const updatePackage = require("./updatePackage");

/**
 * Creates a Package document.
 * @param {string} arg
 * @param {string} type
 * @param {function} callback
 * @returns {Promise<Package|undefined>}
 */
module.exports = async (arg, type, callback) => {
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
    const package = await Package.create(query);
    updatePackage(package, callback);
    return package;
  } catch (e) {
    console.log(e);
  }
};
