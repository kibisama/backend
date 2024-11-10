const addToSetDailyOrder = require("./addToSetDailyOrder");
const puppet = require("../../api/puppet");

module.exports = async (item, package) => {
  try {
    const report = await addToSetDailyOrder(item);
    if (!report) {
      return;
    }
    // const result = await puppet.cardinal.updateItem(package.ndc11);
    const result = await puppet.cardinal.updateItem("68180-0512-01");
  } catch (e) {
    console.log(e);
  }
};
