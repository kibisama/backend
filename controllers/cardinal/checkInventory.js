const CardinalInvoice = require("../../schemas/cardinal/cardinalInvoice");
const Item = require("../../schemas/item");
const Package = require("../../schemas/package");
const dayjs = require("dayjs");
const inputItemCost = require("../../services/cardinal/inputItemCost");

module.exports = async (req, res, next) => {
  const date = dayjs(req.params.date, "MM-DD-YYYY");
  console.log(`Checking Cardinal Inventories ...`);
  const dateStart = dayjs(date).startOf("date");
  const dateEnd = dayjs(date).endOf("date");
  const shortDate = date.add(1, "year");
  try {
    const invoices = await CardinalInvoice.find({
      invoiceDate: { $gte: dateStart, $lte: dateEnd },
      invoiceType: { $ne: "other" },
    });
    let invoiceItems = [];
    let invoiceCosts = [];
    let invoiceShipQty = [];
    let invoiceTradeNames = [];
    invoices.forEach((v) => {
      invoiceItems = [...invoiceItems, ...v.item];
      invoiceCosts = [...invoiceCosts, ...v.cost];
      invoiceShipQty = [...invoiceShipQty, ...v.shipQty];
      invoiceTradeNames = [...invoiceTradeNames, ...v.tradeName];
    });
    const items = await Item.find({
      source: "Cardinal",
      dateReceived: { $gte: dateStart, $lte: dateEnd },
    });
    const expiringItems = items.filter((v) => dayjs(v.exp).isBefore(shortDate));
    const missingItems = [];
    for (let i = 0; i < invoiceItems.length; i++) {
      const ndc = await Package.findOne(
        {
          ndc11: invoiceItems[i],
        },
        { ndc: 1 }
      );
      if (!ndc) {
        // Note: If the corresponding package document is missing, items cannot be checked correctly
        missingItems.push({
          tradeName: invoiceTradeNames[i],
          ndc: invoiceItems[i],
          cost: invoiceCosts[i],
          qty: invoiceShipQty[i],
        });
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
              tradeName: invoiceTradeNames[i],
              ndc: invoiceItems[i],
              cost: invoiceCosts[i],
              qty: missingQty,
            });
          }
          break;
        }
      }
    }
    //
    // checkStatus: "unchecked" => "pending" or "checked" if no missingItems
    //
    // testing
    await inputItemCost(req.params.date);
    return res.send({ extraItems: items, missingItems, expiringItems });
  } catch (e) {
    console.log(e);
    next(e);
  }
};
