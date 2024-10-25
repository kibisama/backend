const dayjs = require("dayjs");
const customParseFormat = require("dayjs/plugin/customParseFormat");
dayjs.extend(customParseFormat);
const CardinalInvoice = require("../../schemas/cardinal/cardinalInvoice");

module.exports = async (invoiceDetails) => {
  try {
    const {
      invoiceNumber,
      invoiceDate,
      orderNumber,
      orderDate,
      poNumber,
      totalShipped,
      totalAmount,
      cin,
      ndcupc,
      tradeName,
      form,
      origQty,
      orderQty,
      shipQty,
      omitCode,
      cost,
      confirmNumber,
      itemClass,
    } = invoiceDetails;
    const _invoiceDate = dayjs(invoiceDate, "MM/DD/YYYY");
    const _orderDate = dayjs(orderDate, "MM/DD/YYYY");
    let invoiceType = "";
    switch (true) {
      case ndcupc.some((v) => v[6] === "-"):
        invoiceType = "OTHER";
        break;
      case itemClass.includes("C2"):
        invoiceType = "C2";
        break;
      case itemClass.includes("C3") ||
        itemClass.includes("C4") ||
        itemClass.includes("C5"):
        invoiceType = "SCHEDULED";
        break;
      case itemClass.includes("Rx"):
        invoiceType = "RX";
        break;
      default:
        invoiceType = "RX";
    }
    await CardinalInvoice.create({
      invoiceNumber,
      invoiceDate: _invoiceDate,
      orderNumber,
      orderDate: _orderDate,
      poNumber,
      invoiceType,
      item: ndcupc,
      cin,
      tradeName,
      form,
      origQty: origQty.map((v) => (v ? Number(v) : 0)),
      orderQty: orderQty.map((v) => (v ? Number(v) : 0)),
      shipQty: shipQty.map((v) => (v ? Number(v) : 0)),
      omitCode,
      cost: cost.map((v) => v.replace(/[^0-9.-]+/g, "")),
      confirmNumber,
      totalShipped: Number(totalShipped),
      totalAmount: Number(totalAmount.replace(/[^0-9.-]+/g, "")),
    });
  } catch (e) {
    console.log(e);
  }
};
