const dayjs = require("dayjs");
const Package = require("../../schemas/inventory/package");
const Item = require("../../schemas/inventory/item");
const mergeDailyInvoices = require("./mergeDailyInvoices");

module.exports = async (_date) => {
  try {
    const date = dayjs(_date, "MM-DD-YYYY");
    const dateStart = date.startOf("date");
    const dateEnd = date.endOf("date");
    const { invoiceItems, invoiceCosts, invoiceShipQty, invoiceTradeNames } =
      await mergeDailyInvoices(_date, "rxOnly", { needles: true });
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
        indices.forEach((v, i) => {
          costAndShipQty[i] = {
            cost: invoiceCosts[v],
            shipQty: invoiceShipQty[v],
          };
        });
        costAndShipQty.sort(
          (a, b) =>
            Number(b.cost.replace(/[^0-9.-]+/g, "")) -
            Number(a.cost.replace(/[^0-9.-]+/g, ""))
        );
        const ndc = await Package.findOne(
          {
            ndc11: duplicate,
          },
          { ndc: 1 }
        );
        if (!ndc) {
          continue;
        }
        const match = new RegExp(
          String.raw`\d{3}${ndc.ndc.replaceAll("-", "")}\d{1}`
        );
        const _ids = [];
        const items = await Item.find({
          gtin: { $regex: match },
          source: "CARDINAL",
          dateReceived: { $gte: dateStart, $lte: dateEnd },
        });
        items.forEach((v, i) => {
          _ids[i] = v._id;
        });

        for (let i = 0; i < costAndShipQty.length; i++) {
          for (let j = 0; j < costAndShipQty[i].shipQty; j++) {
            if (costAndShipQty[i].shipQty > 0) {
              if (_ids.length > 0) {
                await Item.findOneAndUpdate(
                  { _id: _ids[_ids.length - 1] },
                  {
                    $set: {
                      cost: costAndShipQty[i].cost.toLocaleString("en-US", {
                        style: "currency",
                        currency: "USD",
                      }),
                    },
                  }
                );
                _ids.pop();
              } else {
                break;
              }
            }
          }
        }
        if (_ids.length > 0) {
          for (const _id of _ids) {
            await Item.findOneAndUpdate(
              { _id: _id },
              { $set: { cost: "$0.00" } }
            );
          }
        }
        indices.forEach((v, i) => {
          invoiceItems.splice(v, 1);
          invoiceCosts.splice(v, 1);
          invoiceShipQty.splice(v, 1);
          invoiceTradeNames.splice(v, 1);
          if (indices[i + 1]) {
            indices[i + 1] -= 1;
          }
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
      if (!ndc) {
        continue;
      }
      const match = new RegExp(
        String.raw`\d{3}${ndc.ndc.replaceAll("-", "")}\d{1}`
      );
      const items = await Item.find({
        gtin: { $regex: match },
        source: "CARDINAL",
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
            { $set: { cost: "$0.00" } }
          );
        }
      }
    }
  } catch (e) {
    console.log(e);
  }
};
