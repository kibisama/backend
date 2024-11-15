const dayjs = require("dayjs");
const DailyOrder = require("../../schemas/inventory/dailyOrder");

const getDailyOrder = async (req, res, next) => {
  const dateParam = req.params.date;
  const day = dayjs(dateParam, "MM-DD-YYYY");
  const startOfDay = day.startOf("d");
  const endOfDay = day.endOf("d");
  try {
    const results = await DailyOrder.find({
      date: { $gte: startOfDay, $lte: endOfDay },
    }).populate([
      { path: "item", select: ["cost", "dateReceived", "source"] },
      { path: "package", select: ["brand_name", "ndc11", "manufacturer_name"] },
    ]);
    return res.send({ results });
  } catch (e) {
    console.log(e);
  }
};

module.exports = getDailyOrder;
