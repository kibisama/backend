const DailyOrder = require("../../schemas/inventory/dailyOrder");
const Item = require("../../schemas/inventory/item");

module.exports = async (item) => {
  try {
    let prevCost = "";
    if (item.cost) {
      prevCost = item.cost;
    }
    // else {
    //   const result = await Item.findOne(
    //     { gtin: item.gtin, cost: { $ne: undefined } },
    //     { cost: 1 },
    //     { sort: { dateReceived: -1 } }
    //   );
    //   if (result) {
    //     prevCost = result.cost;
    //   }
    // }
    // const prevSource = item.source ?? "";
    const orderStatus = "FILLED";

    return await DailyOrder.create({
      item: item._id,
      // prevCost,
      // prevSource,
      orderStatus,
    });
  } catch (e) {
    console.log(e);
  }
};
