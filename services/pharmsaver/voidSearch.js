const { PSSearch } = require("../../schemas/pharmsaver");
const { Alternative } = require("../../schemas/inventory");

/**
 * Voids a PS Search document.
 * @param {ObjectId} alternative
 * @returns {Promise<PSSearch|undefined>}
 */
module.exports = async (alternative) => {
  try {
    const psSearch = await PSSearch.findOneAndUpdate(
      { alternative },
      { $set: { lastUpdated: new Date(), active: false } },
      { new: true }
    );
    if (psSearch) {
      return psSearch;
    } else {
      const psSearch = await PSSearch.create({
        alternative,
        lastUpdated: new Date(),
        active: false,
      });
      await Alternative.findOneAndUpdate(
        { _id: alternative },
        { psSearch: psSearch._id }
      );
      return psSearch;
    }
  } catch (e) {
    console.log(e);
  }
};
