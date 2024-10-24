const dayjs = require("dayjs");

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
    let invoiceShipQty = [];
    let invoiceTradeNames = [];
    let invoiceForms = [];
    invoices.forEach((v, i) => {
      invoiceNumbers[i] = v.invoiceNumber;
      invoiceItems = [...invoiceItems, ...v.item];
      invoiceCosts = [...invoiceCosts, ...v.cost];
      invoiceShipQty = [...invoiceShipQty, ...v.shipQty];
      invoiceTradeNames = [...invoiceTradeNames, ...v.tradeName];
      invoiceForms = [...invoiceForms, ...v.form];
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
      invoiceShipQty,
      invoiceTradeNames,
      invoiceForms,
    };
  } catch (e) {
    console.log(e);
  }
};
