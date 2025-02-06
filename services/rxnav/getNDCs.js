const { getNDCs } = require("../../api/rxnav");

/**
 * Gets NDCs by rxcui via getNDCs api.
 * @param {string} rxcui
 * @returns {Promise<Array|Error>}
 */
module.exports = async (rxcui) => {
  try {
    const result = await getNDCs(rxcui);
    if (result instanceof Error) {
      return result;
    }
    const { ndcList } = result.data.ndcGroup;
    if (ndcList.ndc?.length > 0) {
      return ndcList.ndc;
    }
    return new Error("Not found");
  } catch (e) {
    console.log(e);
    return e;
  }
};
