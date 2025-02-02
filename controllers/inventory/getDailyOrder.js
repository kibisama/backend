const dayjs = require("dayjs");
const { DailyOrder } = require("../../schemas/inventory");

const getDailyOrder = async (req, res, next) => {
  const dateParam = req.params.date;
  const day = dayjs(dateParam, "MM-DD-YYYY");
  const startOfDay = day.startOf("d");
  const endOfDay = day.endOf("d");
  try {
    const results = await DailyOrder.find({
      date: { $gte: startOfDay, $lte: endOfDay },
    }).populate([
      {
        path: "items",
        select: ["cost", "source", "dateReceived", "dateFilled"],
      },
      {
        path: "package",
        select: [
          "ndc11",
          "name",
          "mfrName",
          "optimalQty",
          "preferred",
          "inventories",
        ],
        populate: [
          {
            path: "alternative",
            select: [],
            populate: [
              { path: "cardinalSource", select: [] },
              { path: "psSearch" },
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
              //
            ],
          },
          {
            path: "psItem",
          },
        ],
      },
    ]);
    return res.send({ results });
  } catch (e) {
    console.log(e);
  }
};

module.exports = getDailyOrder;
