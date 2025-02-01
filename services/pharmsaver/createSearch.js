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
    const psSearch = await PSSearch.create({
      alternative,
      lastUpdated: new Date(),
      active: true,
      results,
    });
    await Alternative.findOneAndUpdate(
      { _id: alternative },
      { psSearch: psSearch._id }
    );
    return psSearch;
  } catch (e) {
    console.log(e);
  }
};
