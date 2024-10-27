const dayjs = require("dayjs");
const customParseFormat = require("dayjs/plugin/customParseFormat");
dayjs.extend(customParseFormat);

module.exports = async (_date, rxOnly, exceptions) => {
  const date = dayjs(_date, "MM-DD-YYYY");
  const dateStart = dayjs(date).startOf("date");
  const dateEnd = dayjs(date).endOf("date");
  const query = { invoiceDate: { $gte: dateStart, $lte: dateEnd } };
  if (rxOnly) {
    query.invoiceType = { $ne: "OTHER" };
  }
  try {
    const invoices = await CardinalInvoice.find(query);
    let invoiceNumbers = [];
    let invoiceItems = [];
    let invoiceCosts = [];
    let invoiceOrigQty = [];
    let inoviceOrderQty = [];
    let invoiceShipQty = [];
    let invoiceOmitCodes = [];
    let invoiceTradeNames = [];
    let invoiceForms = [];
    let inoviceTotalShipped = 0;
    let invoiceTotalAmount = 0;
    invoices.forEach((v, i) => {
      invoiceNumbers[i] = v.invoiceNumber;
      invoiceItems = [...invoiceItems, ...v.item];
      invoiceCosts = [...invoiceCosts, ...v.cost];
      invoiceOrigQty = [...invoiceOrigQty, ...v.origQty];
      inoviceOrderQty = [...inoviceOrderQty, ...v.orderQty];
      invoiceShipQty = [...invoiceShipQty, ...v.shipQty];
      invoiceOmitCodes = [...invoiceOmitCodes, ...v.omitCode];
      invoiceTradeNames = [...invoiceTradeNames, ...v.tradeName];
      invoiceForms = [...invoiceForms, ...v.form];
      inoviceTotalShipped += v.totalShipped;
      invoiceTotalAmount += v.totalAmount;
    });

    if (exceptions) {
      if (exceptions.needles) {
        invoiceForms.forEach((v, i) => {
          if (v === "NEDL") {
            invoiceItems.splice(i, 1);
            invoiceCosts.splice(i, 1);
            invoiceShipQty.splice(i, 1);
            invoiceTradeNames.splice(i, 1);
          }
        });
      }
    }

    return {
      invoiceNumbers,
      invoiceItems,
      invoiceCosts,
      invoiceOrigQty,
      inoviceOrderQty,
      invoiceShipQty,
      invoiceOmitCodes,
      invoiceTradeNames,
      invoiceForms,
      inoviceTotalShipped,
      invoiceTotalAmount,
    };
  } catch (e) {
    console.log(e);
  }
};
