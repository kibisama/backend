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
    const { rxtermsProperties } = result.data;
    if (!rxtermsProperties) {
      return new Error("Not found");
    }
    return rxtermsProperties;
  } catch (e) {
    console.log(e);
    return e;
  }
};
