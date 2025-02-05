const dayjs = require("dayjs");
const { DailyOrder } = require("../../schemas/inventory");

const productSel = [
  "lastUpdated",
  "active",
  "priority",
  "name",
  "cin",
  "lastOrdred",
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
const sourceSel = productSel.concat(["ndc", "mfr", "size"]);

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
                { path: "cardinalSource", select: sourceSel },
                { path: "psSearch" },
              ],
            },
            {
              path: "cardinalProduct",
              select: productSel,
            },
            {
              path: "psItem",
            },
          ],
        },
      ])
    ).map((v) => {
      console.log(v);
      const package = v.package;
      // time
      const time = dayjs(v.date).format("hh:mm A");
      // package
      const name = package.name
        ? package.name
        : package.ndc11
        ? package.ndc11
        : package.gtin;
      const mfr = package.mfrName
        ? package.mfrName
        : package.manufacturerName
        ? package.manufacturerName
        : package.labeler_name;
      // qty
      // const filled = v.items.length;
      // const stock = package.inventories.length;
      // const optimalStock = package.optimalStock;
      return {
        time,
        package: { name, mfr },
      };
    });
    return res.send({ results });
  } catch (e) {
    console.log(e);
  }
};

module.exports = getDailyOrder;
