const dayjs = require("dayjs");
const customParseFormat = require("dayjs/plugin/customParseFormat");
dayjs.extend(customParseFormat);
const CardinalInvoice = require("../../schemas/cardinal/cardinalInvoice");
const mergeDailyInvoices = require("./mergeDailyInvoices");

const omitCodes = {
  "01": "RESTRICTED CODE",
  "02": "DC DISCONTINUED",
  "03": "MFG DISCONTINUED",
  "04": "DROPSHIP",
  "05": "AVAILABILITY ISSUE",
  "5A": "NEW ITEM",
  "5B": "NON STOCK",
  "06": "TEMP OUT",
};

module.exports = async (date) => {
  const duplicatesWithDifferentPrices = [];
  const backorderedItems = [];
  const differentQtyShipped = [];
  const priceChangedItems = [];
  try {
    const {
      invoiceItems,
      invoiceTradeNames,
      invoiceCosts,
      invoiceOrigQty,
      invoiceOrderQty,
      invoiceShipQty,
      invoiceOmitCodes,
      invoiceTotalShipped,
      invoiceTotalAmount,
    } = await mergeDailyInvoices(date);
    // Eval 1: If the same item has two different prices, push the item into duplicateWithDifferentPrcies
    const duplicates = new Set(
      invoiceItems.filter((v, i) => invoiceItems.indexOf(v) !== i)
    );
    if (duplicates.size > 0) {
      for (const duplicate of duplicates) {
        const costs = [];
        invoiceItems.forEach((v, i) => {
          if (v === duplicate) {
            costs.push(invoiceCosts[i]);
          }
        });
        if (!costs.every((v, i, a) => v === a[0])) {
          duplicatesWithDifferentPrices.push({
            item: duplicate,
            tradeName: invoiceTradeNames[invoiceItems.indexOf(duplicate)],
            costs,
          });
        }
      }
    }
    // Eval 2: If OrigQty exists, push the item into backorderedItems
    invoiceOrigQty.forEach((v, i) => {
      if (v > 0) {
        backorderedItems.push({
          item: invoiceItems[i],
          tradeName: invoiceTradeNames[i],
          origQty: v,
          shipQty: invoiceShipQty[i],
        });
      }
    });
    // Eval 3: If OrderQty and ShipQty are not the same, push the item into differentQtyShipped
    invoiceOrderQty.forEach((v, i) => {
      if (v !== invoiceShipQty[i]) {
        differentQtyShipped.push({
          item: invoiceItems[i],
          tradeName: invoiceTradeNames[i],
          orderQty: v,
          shipQty: invoiceShipQty[i],
          omitCode: invoiceOmitCodes[i]
            ? omitCodes[invoiceOmitCodes[i]]
            : invoiceOmitCodes[i],
        });
      }
    });

    return {
      duplicatesWithDifferentPrices,
      backorderedItems,
      differentQtyShipped,
      priceChangedItems,
      invoiceTotalShipped,
      invoiceTotalAmount,
    };
  } catch (e) {
    console.log(e);
  }
};
