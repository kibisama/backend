const { getAllRelatedInfo } = require("../../api/rxnav");

/**
 * Gets all related info via getAllRelatedInfo api.
 * @param {string} rxcui
 * @returns {Promise<object|Error>}
 */
module.exports = async (rxcui) => {
  try {
    const result = await getAllRelatedInfo(rxcui);
    if (result instanceof Error) {
      return result;
    }
    const { conceptGroup } = result.data.allRelatedGroup;
    const results = {};
    for (let i = 0; i < conceptGroup.length; i++) {
      const { tty, conceptProperties } = conceptGroup[i];
      const properties = conceptProperties?.[0];
      if (!properties) {
        continue;
      }
      const { rxcui, name } = properties;
      results[tty] = {};
      results[tty].rxcui = rxcui;
      results[tty].name = name;
    }
    return results;
  } catch (e) {
    console.log(e);
    return e;
  }
};
