const CardinalInvoice = require("../../schemas/cardinal/cardinalInvoice");
const Item = require("../../schemas/inventory/item");
const Package = require("../../schemas/inventory/package");
const dayjs = require("dayjs");
const customParseFormat = require("dayjs/plugin/customParseFormat");
dayjs.extend(customParseFormat);
const mergeDailyInvoices = require("../../services/cardinal/mergeDailyInvoices");
const inputItemCost = require("../../services/cardinal/inputItemCost");

module.exports = async (req, res, next) => {
  console.log(`Checking Cardinal Inventories ...`);

  try {
    const { invoiceItems, invoiceCosts, invoiceShipQty, invoiceTradeNames } =
      await mergeDailyInvoices(req.params.date, true, { needles: true });
    const date = dayjs(req.params.date, "MM-DD-YYYY");
    const dateStart = dayjs(date).startOf("date");
    const dateEnd = dayjs(date).endOf("date");

    // Todo: Make shortDate variable via global option
    const shortDate = date.add(1, "year");
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
      // Note: If the corresponding package document is missing, items cannot be checked correctly
      if (!ndc) {
        if (invoiceShipQty[i] > 0) {
          missingItems.push({
            tradeName: invoiceTradeNames[i],
            ndc: invoiceItems[i],
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
    if (missingItems.length === 0) {
      await inputItemCost(req.params.date);
    }
    // Todo: also send items
    return res.send({ extraItems: items, missingItems, expiringItems });
  } catch (e) {
    console.log(e);
    next(e);
  }
};
