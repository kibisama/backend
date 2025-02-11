const dayjs = require("dayjs");
const { DailyOrder } = require("../../schemas/inventory");
const mapDailyOrder = require("../../services/inventory/dailyOrder/mapDailyOrder");

const cahPrdSel = [
  "lastUpdated",
  "active",
  "priority",
  "name",
  "ndc",
  "cin",
  "mfr",
  "size",
  "lastOrdered",
  "invoiceCost",
  "estNetCost",
  "netUoiCost",
  "returnable",
  "stockStatus",
  "contract",
  "stock",
  "avlAlertUpdated",
  "avlAlertMsg",
  "avlAlertAddMsg",
  "avlAlertExpected",
  "analysis",
];

const getDailyOrder = async (req, res, next) => {
  try {
    const dateParam = req.params.date;
    const day = dayjs(dateParam, "MM-DD-YYYY");
    const startOfDay = day.startOf("d");
    const endOfDay = day.endOf("d");
    const results = (
      await DailyOrder.find({
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
                { path: "cardinalSource", select: cahPrdSel },
                { path: "sourcePackage", populate: [{ path: "psItem" }] },
                { path: "psSearch" },
              ],
            },
            { path: "cardinalProduct", select: cahPrdSel },
            { path: "psItem" },
          ],
        },
      ])
    ).map((v) => mapDailyOrder(v));
    return res.send({ results });
  } catch (e) {
    console.log(e);
  }
};

module.exports = getDailyOrder;
