const dayjs = require("dayjs");
const { scheduleJob } = require("node-schedule");
const { cardinal } = require("../../api/puppet");
// const { CardinalProduct } = require("../../schemas/cardinal");
// const { Package, Alternative } = require("../../schemas/inventory");
const getNDCs = require("../rxnav/getNDCs");
const update = require("./update");

/**
 * Request the Puppeteer server to update cardinalSource.
 * This create document and/or
 * @param {Alternative} alternative
 * @param {function} callback
 * @returns {Promise<CardinalProduct|Error>}
 */
module.exports = async function updateProduct(_alternative, callback) {
  const { rxcui } = _alternative;
  const ndcs = [];
  for (let i = 0; i < rxcui.length; i++) {
    const ndc = await getNDCs(rxcui[i]);
    if (!(ndc instanceof Error)) {
      ndcs.push.apply(ndcs, ndc);
    }
  }
  if (ndcs.length === 0) {
    return new Error();
  }
  update("getProductDetails", ndcs);
};
