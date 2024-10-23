const dayjs = require("dayjs");
const customParseFormat = require("dayjs/plugin/customParseFormat");
dayjs.extend(customParseFormat);
const CardinalInvoice = require("../../schemas/cardinal/cardinalInvoice");
const CardinalItem = require("../../schemas/cardinal/cardinalItem");

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
    // for (let i = 0; i < cin.length; i++) {
    //   const result = await CardinalItem.findOne({ cin: cin[i] });
    //   if (!result) {
    //     await CardinalItem.create({ cin: cin[i], ndcupc: ndcupc[i] });
    //   }
    // }
    let invoiceType = "";
    switch (true) {
      case ndcupc.some((v) => v[6] === "-"):
        invoiceType = "other";
        break;
      case itemClass.includes("C2"):
        invoiceType = "C2";
        break;
      case itemClass.includes("C3") ||
        itemClass.includes("C4") ||
        itemClass.includes("C5"):
        invoiceType = "scheduled";
        break;
      //   case itemClass.includes("Rx"):
      //     invoiceType = "Rx";
      //     break;
      //   case itemClass.includes("HBC") || itemClass.includes("OTHER"):
      //     invoiceType = "other";
      default:
        invoiceType = "rx";
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
      origQty: origQty.map((v) => (v ? Number(v) : 0)),
      orderQty: orderQty.map((v) => (v ? Number(v) : 0)),
      shipQty: shipQty.map((v) => (v ? Number(v) : 0)),
      omitCode,
      cost: cost.map((v) => v.replace(/[^0-9.-]+/g, "")),
      confirmNumber,
      totalShipped: totalShipped ? Number(totalShipped) : 0,
      totalAmount: totalAmount.replace(/[^0-9.-]+/g, ""),
    });
  } catch (e) {
    console.log(e);
  }
};
