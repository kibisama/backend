const CardinalInvoice = require("../../schemas/cardinal/cardinalInvoice");
const Item = require("../../schemas/item");
const Package = require("../../schemas/package");
const dayjs = require("dayjs");

module.exports = async (req, res, next) => {
  const date = dayjs(req.params.date, "MM-DD-YYYY");
  console.log(`Checking Cardinal Inventories ...`);
  const dateStart = dayjs(date).endOf("date");
  const dateEnd = dayjs(date).endOf("date");
  const shortDate = date.add(1, "year");
  try {
    const invoices = await CardinalInvoice.find({
      invoiceDate: { $gte: dateStart, $lte: dateEnd },
      invoiceType: { $not: "other" },
    });
    const items = await Item.find({
      source: "Cardinal",
      dateReceived: { $gte: dateStart, $lte: dateEnd },
    });
    const expiringItems = items.filter((v) => dayjs(v.exp).isBefore(shortDate));
    const missingItems = [];
    for (let i = 0; i < invoices.length; i++) {
      for (let j = 0; j < invoices[i].item.length; j++) {
        const ndc = await Package.findOne(
          {
            ndc11: invoices[i].item[j],
          },
          { ndc: 1 }
        );
        if (!ndc) {
          // if a corresponding package document missing, items cannot be checked
          missingItems.push({
            tradeName: invoices[i].tradeName[j],
            ndc: invoices[i].item[j],
            qty: invoices[i].shipQty[j],
          });
          break;
        }
        const match = new RegExp(
          String.raw`\d{3}${ndc.ndc.replaceAll("-", "")}\d{1}`
        );
        for (let k = 0; k < invoices[i].shipQty[j]; k++) {
          const index = items.findIndex((v) => v.gtin.match(match));
          if (index !== 1) {
            items.splice(index, 1);
          } else {
            const missingQty = invoices[i].shipQty[j] - k;
            missingItems.push({
              tradeName: invoices[i].tradeName[j],
              ndc: invoices[i].item[j],
              qty: missingQty,
            });
            break;
          }
        }
      }
    }
    return res.send({ extraItems: items, missingItems, expiringItems });
  } catch (e) {
    console.log(e);
    next(e);
  }
};
