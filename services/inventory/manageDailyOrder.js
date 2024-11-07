const addToSetDailyOrder = require("./addToSetDailyOrder");
const puppet = require("../../api/puppet");

module.exports = async (item, package) => {
  try {
    const report = await addToSetDailyOrder(item);
    if (!report) {
      return;
    }
    const result = await puppet.cardinal.updateItem(package.ndc11);
  } catch (e) {
    console.log(e);
  }
};
