const { findRelatedNDCs } = require("../../api/rxnav");
const { hyphenateNDC11 } = require("../convert");

/**
 * Gets related NDCs by a NDC via findRelatedNDCs api.
 * @param {string} id a 11-digit ndc
 * @returns {Promise<object|Error>}
 */
module.exports = async (id) => {
  try {
    const result = await findRelatedNDCs(id);
    if (result instanceof Error) {
      return result;
    }
    const { ndcInfo } = result.data.ndcInfoList;
    if (ndcInfo.length > 0) {
      const result = {};
      ndcInfo.forEach((v) => {
        const { tty, status, ndc11, rxcui } = v;
        if (!result[status]) {
          result[status] = {};
        }
        if (!result[status][tty]) {
          result[status][tty] = [];
        }
        if (ndc11 === id.replaceAll("-", "")) {
          result.rxcui = rxcui;
          result.tty = tty;
        }
        result[status][tty].push(hyphenateNDC11(ndc11));
      });
      return result;
    }
    return new Error("Not found");
  } catch (e) {
    console.log(e);
    return e;
  }
};
