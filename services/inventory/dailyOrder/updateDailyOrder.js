const dayjs = require("dayjs");
const { DailyOrder, Alternative } = require("../../../schemas/inventory");
const { CardinalProduct } = require("../../../schemas/cardinal");

/**
 * Updates a Daily Order document.
 * @param {Package} package
 * @returns {Promise<DailyOrder|undefined>}
 */
module.exports = async (package) => {
  try {
    const { alternative, cardinalProduct } = package;
    let _alternative, _cardinalProduct, _cardinalSource;
    if (alternative) {
      _alternative = await Alternative.findOne({ _id: alternative });
      if (_alternative.cardinalSource) {
      }
    }
  } catch (e) {
    console.log(e);
  }
};
