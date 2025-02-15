const { getAllRxTermInfo } = require("../../api/rxnav");

/**
 * Gets all term info via getAllRxTermInfo api.
 * @param {string} rxcui
 * @returns {Promise<object|Error>}
 */
module.exports = async (rxcui) => {
  try {
    const result = await getAllRxTermInfo(rxcui);
    if (result instanceof Error) {
      return result;
    }
    return result.rxtermsProperties;
  } catch (e) {
    console.log(e);
    return e;
  }
};
