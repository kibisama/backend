const { PSSearch } = require("../../schemas/pharmsaver");
const { Alternative } = require("../../schemas/inventory");

/**
 * Creates a PS Search document.
 * @param {object} results
 * @param {ObjectId} alternative
 * @returns {Promise<PSItem|undefined>}
 */
module.exports = async (results, alternative) => {
  try {
    const query = { lastUpdated: new Date(), active: true, results };
    let psSearch = await PSSearch.findOneAndUpdate(
      { alternative },
      { $set: query },
      { new: true }
    );
    if (!psSearch) {
      psSearch = await PSSearch.create({ alternative, ...query });
    }
    await Alternative.findOneAndUpdate(
      { _id: alternative },
      { psSearch: psSearch._id }
    );
    return psSearch;
  } catch (e) {
    console.log(e);
  }
};
