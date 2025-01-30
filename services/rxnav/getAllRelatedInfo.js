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
      if (conceptProperties?.length > 0) {
        for (let j = 0; j < conceptProperties.length; j++) {
          const { rxcui, name } = conceptProperties[j];
          if (!results[tty]) {
            results[tty] = [];
          }
          results[tty][j] = {};
          results[tty][j].rxcui = rxcui;
          results[tty][j].name = name;
        }
      }
    }
    return results;
  } catch (e) {
    console.log(e);
    return e;
  }
};
