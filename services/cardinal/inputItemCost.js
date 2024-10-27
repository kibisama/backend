const Package = require("../../schemas/inventory/package");
const Item = require("../../schemas/inventory/item");
const mergeDailyInvoices = require("./mergeDailyInvoices");

module.exports = async (_date) => {
  try {
    const { invoiceItems, invoiceCosts, invoiceShipQty, invoiceTradeNames } =
      await mergeDailyInvoices(_date, true, { needles: true });
    const duplicates = new Set(
      invoiceItems.filter((v, i) => invoiceItems.indexOf(v) !== i)
    );
    if (duplicates.size > 0) {
      for (const duplicate of duplicates) {
        const indices = [];
        invoiceItems.forEach((v, i) => {
          if (v === duplicate) {
            indices.push(i);
          }
        });
        const costAndShipQty = [];
        costAndShipQty.sort((a, b) => b.cost - a.cost);
        indices.forEach((v, i) => {
          costAndShipQty[i] = {
            cost: invoiceCosts[v],
            shipQty: invoiceShipQty[v],
          };
        });
        const ndc = await Package.findOne(
          {
            ndc11: invoiceItems[i],
          },
          { ndc: 1 }
        );
        const match = new RegExp(
          String.raw`\d{3}${ndc.ndc.replaceAll("-", "")}\d{1}`
        );
        const _ids = [];
        const items = await Item.find({
          gtin: { $regex: match },
          source: "Cardinal",
          dateReceived: { $gte: dateStart, $lte: dateEnd },
        });
        items.forEach((v, i) => {
          _ids[i] = v._id;
        });
        for (let i = 0; i < costAndShipQty.length; i++) {
          for (let j = 0; j < costAndShipQty[i].shipQty; j++) {
            if (_ids.length > 0) {
              await Item.findOneAndUpdate(
                { _id: _ids[_ids.length - 1] },
                { $set: { cost: costAndShipQty[i].cost } }
              );
              _ids.pop();
            } else {
              break;
            }
          }
        }
        if (_ids.length > 0) {
          for (const _id in _ids) {
            await Item.findOneAndUpdate({ _id: _id }, { $set: { cost: 0 } });
          }
        }
        indices.forEach((v) => {
          invoiceItems.splice(v, 1);
          invoiceCosts.splice(v, 1);
          invoiceShipQty.splice(v, 1);
          invoiceTradeNames.splice(v, 1);
        });
      }
    }

    for (let i = 0; i < invoiceItems.length; i++) {
      const ndc = await Package.findOne(
        {
          ndc11: invoiceItems[i],
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
  } catch (e) {
    console.log(e);
  }
};
