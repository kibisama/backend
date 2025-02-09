const dayjs = require("dayjs");
const { DailyOrder } = require("../../schemas/inventory");

const cahPrdSel = [
  "lastUpdated",
  "active",
  "priority",
  "name",
  "ndc",
  "cin",
  "mfr",
  "size",
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
                { path: "packages", populate: [{ path: "psItem" }] },
                { path: "cardinalSource", select: cahPrdSel },
                { path: "psSearch" },
              ],
            },
            { path: "cardinalProduct", select: cahPrdSel },
            { path: "psItem" },
          ],
        },
      ])
    ).map((v) => {
      console.log(v);
      // 알터네이티브 광역체크해야함
      const result = {};
      // time
      result.time = dayjs(v.date).format("hh:mm A");
      // package
      const package = v.package;
      const alternative = package.alternative;
      result.package = {};
      result.package.title = package.name
        ? package.name
        : package.ndc11
        ? package.ndc11
        : package.gtin;
      result.package.subtitle = package.mfrName
        ? package.mfrName
        : package.manufacturerName
        ? package.manufacturerName
        : package.labeler_name
        ? package.labeler_name
        : "";
      // qty
      // result.qty = v.items.length;
      // const stock = package.inventories.length;
      // const optimalStock = package.optimalStock;
      // cah
      const cahPrd = package.cardinalProduct;
      const cahSrc = alternative?.cardinalSource;
      if (cahSrc) {
        if (cahSrc.contract) {
          result.cahSource = {};
          result.cahSource.title = cahSrc.estNetCost;
          result.cahSource.subtitle = cahSrc.netUoiCost;
        } else {
          result.cahSource = "NA";
        }
      } else {
        result.cahSource = "PENDING";
      }
      if (cahPrd) {
        if (cahPrd.active) {
          result.cahProduct = {};
          result.cahProduct.title = cahPrd.estNetCost;
          result.cahProduct.subtitle = cahPrd.netUoiCost;
          const source = cahPrd.analysis.source;
          if (source) {
            if (typeof result.cahSource === "string") {
              result.cahSource = {};
            }
            result.cahSource.title = source.estNetCost;
            result.cahSource.subtitle = source.netUoiCost;
          } else {
            const contract = cahPrd.contract;
            if (contract) {
              result.cahSource = contract;
            } else {
              result.cahSource = "NA";
            }
          }
        } else {
          result.cahProduct = "NA";
        }
      } else {
        result.cahProduct = "PENDING";
      }
      // ps
      const psItem = package.psItem;
      if (psItem) {
        result.psItem = {};
        result.psItem.title = psItem.pkgPrice;
        result.psItem.subtitle = psItem.unitPrice;
        // if (typeof result.cahSource === "object") {
        // change properties
        // }
        // add tooltip
      } else {
        result.psItem = "PENDING";
      }

      return result;
    });
    return res.send({ results });
  } catch (e) {
    console.log(e);
  }
};

module.exports = getDailyOrder;
