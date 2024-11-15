const CardinalInvoice = require("../../schemas/cardinal/cardinalInvoice");
const Item = require("../../schemas/inventory/item");
const Package = require("../../schemas/inventory/package");
const dayjs = require("dayjs");
const customParseFormat = require("dayjs/plugin/customParseFormat");
dayjs.extend(customParseFormat);
const mergeDailyInvoices = require("../../services/cardinal/mergeDailyInvoices");
const inputItemCost = require("../../services/cardinal/inputItemCost");

module.exports = async (req, res, next) => {
  console.log(`Checking Cardinal Inventories ${req.params.date} ...`);

  try {
    await inputItemCost(req.params.date);

    const {
      invoiceItems,
      invoiceCosts,
      invoiceShipQty,
      invoiceTradeNames,
      exceptionItems,
      exceptionTradeNames,
      exceptionCosts,
      exceptionShipQty,
    } = await mergeDailyInvoices(req.params.date, "rxOnly", { needles: true });
    const date = dayjs(req.params.date, "MM-DD-YYYY");
    const dateStart = dayjs(date).startOf("date");
    const dateEnd = dayjs(date).endOf("date");

    // Todo: Make shortDate variable as a global option
    const shortDate = date.add(1, "year");
    const items = await Item.find({
      source: "CARDINAL",
      dateReceived: { $gte: dateStart, $lte: dateEnd },
    });
    const expiringItems = [];
    const _expiringItems = items.filter((v) =>
      dayjs(v.exp).isBefore(shortDate)
    );
    for (const _expiringItem of _expiringItems) {
      const gtin = _expiringItem.gtin;
      const regEx = new RegExp(
        String.raw`${gtin.slice(3, 7)}-?${gtin[7]}-?${gtin.slice(8, 11)}-?${
          gtin[11]
        }-?${gtin[12]}`
      );
      const package = await Package.findOne({ ndc: { $regex: regEx } });
      if (package) {
        expiringItems.push({
          item: package.ndc11,
          name: package.brand_name,
          expDate: dayjs(_expiringItem.exp).format("MM-DD-YYYY"),
          cost: _expiringItem.cost,
        });
      }
    }

    const missingItems = [];
    for (let i = 0; i < invoiceItems.length; i++) {
      const ndc = await Package.findOne(
        {
          ndc11: invoiceItems[i],
        },
        { ndc: 1 }
      );
      // Note: If the corresponding package document is missing, items cannot be checked correctly
      if (!ndc) {
        if (invoiceShipQty[i] > 0) {
          missingItems.push({
            item: invoiceItems[i],
            tradeName: invoiceTradeNames[i],
            cost: invoiceCosts[i],
            qty: invoiceShipQty[i],
          });
        }
        continue;
      }
      const match = new RegExp(
        String.raw`\d{3}${ndc.ndc.replaceAll("-", "")}\d{1}`
      );
      for (let j = 0; j < invoiceShipQty[i]; j++) {
        const index = items.findIndex((v) => v.gtin.match(match));
        if (index !== -1) {
          items.splice(index, 1);
        } else {
          const missingQty = invoiceShipQty[i] - j;
          if (missingQty > 0) {
            missingItems.push({
              item: invoiceItems[i],
              tradeName: invoiceTradeNames[i],
              cost: invoiceCosts[i],
              qty: missingQty,
            });
          }
          break;
        }
      }
    }
    const priceChangedItems = [];
    // 이하 코드 확인 필요
    // if (invoiceItems.length > 0) {
    //   for (let i = 0; i < invoiceItems.length; i++) {
    //     const item = invoiceItems[i];
    //     const result = CardinalInvoice.findOne(
    //       {
    //         item,
    //         invoiceDate: { $lt: dayjs(date, "MM-DD-YYYY") },
    //       },
    //       { _id: 0, invoiceDate: 1 }
    //     );
    //     if (result) {
    //       const { invoiceItems, invoiceCosts } = await mergeDailyInvoices(
    //         dayjs(result.invoiceDate).format("MM-DD-YYYY")
    //       );
    //       let prevCost;
    //       const costs = [];
    //       invoiceItems.forEach((v, j) => {
    //         if (v === item) {
    //           costs.push(invoiceCosts[j]);
    //         }
    //       });
    //       if (costs.length > 1) {
    //         const _costs = costs.map((v) =>
    //           Number(v.replace(/[^0-9.-]+/g, ""))
    //         );
    //         prevCost = Math.min(..._costs).toLocaleString("en-US", {
    //           style: "currency",
    //           currency: "USD",
    //         });
    //       } else {
    //         prevCost = costs[0];
    //       }
    //       const cost = invoiceCosts[i];
    //       if (cost !== prevCost) {
    //         priceChangedItems.push({
    //           item,
    //           tradeName: invoiceTradeNames[i],
    //           cost,
    //           prevCost,
    //           invoiceDate: dayjs(result.invoiceDate).format("MM-DD-YYYY"),
    //         });
    //       }
    //     }
    //   }
    // }
    let selfCheckItems = [];
    if (exceptionItems.length > 0) {
      for (let i = 0; i < expiringItems.length; i++) {
        selfCheckItems.push({
          item: exceptionItems[i],
          tradeName: exceptionTradeNames[i],
          cost: exceptionCosts[i],
          qty: exceptionShipQty[i],
        });
      }
    }
    {
      const { invoiceItems, invoiceCosts, invoiceTradeNames, invoiceShipQty } =
        await mergeDailyInvoices(req.params.date, "nonRxOnly");
      if (invoiceItems.length > 0) {
        for (let i = 0; i < invoiceItems.length; i++) {
          selfCheckItems.push({
            item: invoiceItems[i],
            tradeName: invoiceTradeNames[i],
            cost: invoiceCosts[i],
            qty: invoiceShipQty[i],
          });
        }
      }
    }

    return res.send({
      extraItems: items,
      missingItems,
      expiringItems,
      priceChangedItems,
      selfCheckItems,
    });
  } catch (e) {
    next(e);
  }
};
