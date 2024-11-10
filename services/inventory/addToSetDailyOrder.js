const dayjs = require("dayjs");
const DailyOrder = require("../../schemas/inventory/dailyOrder");
const Item = require("../../schemas/inventory/item");

module.exports = async (item) => {
  try {
    const date = dayjs(item.dateFilled).format("MM-DD-YYYY");
    let cost;
    if (!item.cost) {
      const result = await Item.findOne(
        { gtin: item.gtin, cost: { $ne: undefined } },
        { cost: 1 },
        { sort: { dateReceived: -1 } }
      );
      if (result) {
        cost = result.cost;
      }
    } else {
      cost = item.cost;
    }

    const report = await DailyOrder.findOne({ date });
    if (!report) {
      return await DailyOrder.create({
        date,
        item: [item._id],
        prevCost: [cost],
        prevSource: item.source,
        status: ["FILLED"],
      });
    }
    return await DailyOrder.findOneAndUpdate(
      { date },
      {
        $push: { prevCost: cost, prevSource: item.source, status: "FILLED" },
        $addToSet: { item: item._id },
      },
      { new: true, upsert: true }
    );
  } catch (e) {
    console.log(e);
  }
};
