const dayjs = require("dayjs");
const CardinalInvoice = require("../../schemas/cardinal/cardinalInvoice");
const Package = require("../../schemas/package");
const Item = require("../../schemas/item");

module.exports = async (_date) => {
  try {
    const date = dayjs(_date, "MM-DD-YYYY");
    console.log(`Updating cost data of Cardinal items ...`);
    //이하 중복코드는 따로 뽑아 모듈화하자
    const dateStart = dayjs(date).startOf("date");
    const dateEnd = dayjs(date).endOf("date");
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
    const duplicates = new Set(
      invoiceItems.filter((v, i) => invoiceItems.indexOf(v) !== i)
    );
    if (duplicates.size > 0) {
      duplicates.forEach((v) => {
        const indices = [];
        invoiceItems.forEach((w, j) => {
          if (v === w) {
            indices.push(j);
          }
        });
        indices.forEach((v) => {
          invoiceItems.splice(v, 1);
          invoiceCosts.splice(v, 1);
          invoiceShipQty.splice(v, 1);
          invoiceTradeNames.splice(v, 1);
        });
      });
    }

    //다른방법으로는 duplicate가 존재하면 해당 아이템만 제외하고 전부 가격을 맥인후 duplicate만 따로 뽑아서 sorting후 가격입력하는 방법이있음 추천.
    for (let i = 0; i < invoiceItems.length; i++) {
      const ndc = await Package.findOne(
        {
          ndc11: invoices[i].item[j],
        },
        { ndc: 1 }
      );
      const match = new RegExp(
        String.raw`\d{3}${ndc.ndc.replaceAll("-", "")}\d{1}`
      );
      const items = await Item.find({
        gtin: { $regex: match },
        source: "Cardinal",
        dateReceived: { $gte: dateStart, $lte: dateEnd },
      });

      for (let j = 0; j < items.length; j++) {
        if (j < invoiceShipQty[i]) {
          await Item.findOneAndUpdate(
            { _id: items[j]._id },
            { $set: { cost: invoiceCosts[i] } }
          );
        } else {
          await Item.findOneAndUpdate(
            { _id: items[j]._id },
            { $set: { cost: 0 } }
          );
        }
      }
    }
    //duplicate는 따로처리해준다
  } catch (e) {
    console.log(e);
  }
};
