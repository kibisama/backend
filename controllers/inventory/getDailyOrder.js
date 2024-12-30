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
      {
        path: "package",
        select: [
          "ndc11",
          "brand_name",
          "generic_name",
          "manufacturer_name",
          "product_type",
          "dosage_form",
          "active_ingredients",
          "strength",
          "route",
          "size",
          "unit",
        ],
      },
      {
        path: "cardinalProduct",
        select: [
          "lastUpdated",
          "name",
          "brandName",
          "cin",
          "estNetCost",
          "netUoiCost",
          "returnable",
          "stockStatus",
          "contract",
          "stock",
        ],
      },
    ]);
    return res.send({ results });
  } catch (e) {
    console.log(e);
  }
};

module.exports = getDailyOrder;
