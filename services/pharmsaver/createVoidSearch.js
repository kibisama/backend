const PSSearch = require("../../schemas/pharmsaver/search");

/**
 * Inactivates a PS Search document or creates a new document if not exists.
 * @param {string} ndc11 11-digits without hyphens
 * @returns {Promise<PSSearch|undefined>}
 */
module.exports = async (ndc11) => {
  try {
    let psSearch = await PSSearch.findOneAndUpdate(
      { query: ndc11 },
      { $set: { lastUpdated: new Date(), active: false } },
      { new: true }
    );
    if (!psSearch) {
      psSearch = await PSSearch.create({
        lastUpdated: new Date(),
        query: ndc11,
      });
    }
    return psSearch;
  } catch (e) {
    console.log(e);
  }
};
