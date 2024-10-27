const dayjs = require("dayjs");
const customParseFormat = require("dayjs/plugin/customParseFormat");
dayjs.extend(customParseFormat);
const CardinalInvoice = require("../../schemas/cardinal/cardinalInvoice");

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
    let invoiceOrderQty = [];
    let invoiceShipQty = [];
    let invoiceOmitCodes = [];
    let invoiceTradeNames = [];
    let invoiceForms = [];
    let invoiceTotalShipped = 0;
    let invoiceTotalAmount = 0;
    invoices.forEach((v, i) => {
      invoiceNumbers[i] = v.invoiceNumber;
      invoiceItems = [...invoiceItems, ...v.item];
      invoiceCosts = [...invoiceCosts, ...v.cost];
      invoiceOrigQty = [...invoiceOrigQty, ...v.origQty];
      invoiceOrderQty = [...invoiceOrderQty, ...v.orderQty];
      invoiceShipQty = [...invoiceShipQty, ...v.shipQty];
      invoiceOmitCodes = [...invoiceOmitCodes, ...v.omitCode];
      invoiceTradeNames = [...invoiceTradeNames, ...v.tradeName];
      invoiceForms = [...invoiceForms, ...v.form];
      invoiceTotalShipped += v.totalShipped;
      invoiceTotalAmount += Number(v.totalAmount.replace(/[^0-9.-]+/g, ""));
    });
    invoiceTotalAmount = invoiceTotalAmount.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });
    const result = {
      invoiceNumbers,
      invoiceItems,
      invoiceCosts,
      invoiceOrigQty,
      invoiceOrderQty,
      invoiceShipQty,
      invoiceOmitCodes,
      invoiceTradeNames,
      invoiceForms,
      invoiceTotalShipped,
      invoiceTotalAmount,
    };
    if (exceptions) {
      const exceptionItems = [];
      const exceptionCosts = [];
      const exceptionOrigQty = [];
      const exceptionOrderQty = [];
      const exceptionShipQty = [];
      const exceptionOmitCodes = [];
      const exceptionTradeNames = [];
      const exceptionForms = [];

      if (exceptions.needles) {
        invoiceForms.forEach((v, i) => {
          if (v === "NEDL") {
            exceptionItems.push(invoiceItems.splice(i, 1)[0]);
            exceptionCosts.push(invoiceCosts.splice(i, 1)[0]);
            exceptionOrigQty.push(invoiceOrigQty.splice(i, 1)[0]);
            exceptionOrderQty.push(invoiceOrderQty.splice(i, 1)[0]);
            exceptionShipQty.push(invoiceShipQty.splice(i, 1)[0]);
            exceptionOmitCodes.push(invoiceOmitCodes.splice(i, 1)[0]);
            exceptionTradeNames.push(invoiceTradeNames.splice(i, 1)[0]);
            exceptionForms.push(invoiceForms.splice(i, 1)[0]);
          }
        });
      }
      result.exceptionItems = exceptionItems;
      result.exceptionCosts = exceptionCosts;
      result.exceptionOrigQty = exceptionOrigQty;
      result.exceptionOrderQty = exceptionOrderQty;
      result.exceptionShipQty = exceptionShipQty;
      result.exceptionOmitCodes = exceptionOmitCodes;
      result.exceptionTradeNames = exceptionTradeNames;
      result.exceptionForms = exceptionForms;
    }
    return result;
  } catch (e) {
    console.log(e);
  }
};
