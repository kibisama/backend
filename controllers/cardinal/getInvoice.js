const dayjs = require("dayjs");
const CardinalInvoice = require("../../schemas/cardinal/cardinalInvoice");
const evalInvoice = require("../../services/cardinal/evalInvoice");

module.exports = async (req, res, next) => {
  try {
    const dateParam = req.params.date;
    const date = dayjs(dateParam, "MM-DD-YYYY");
    const dateStart = date.startOf("date");
    const dateEnd = date.endOf("date");
    const results = await CardinalInvoice.find(
      {
        invoiceDate: { $gte: dateStart, $lte: dateEnd },
      },
      { _id: 0, invoiceNumber: 1 }
    );
    const {
      duplicatesWithDifferentPrices,
      backorderedItems,
      differentQtyShipped,
      priceChangedItems,
    } = await evalInvoice(dateParam);
    return res.send({
      invoiceNumbers: results.map((v) => v.invoiceNumber),
      duplicatesWithDifferentPrices,
      backorderedItems,
      differentQtyShipped,
      priceChangedItems,
    });
  } catch (e) {
    console.log(e);
    next(e);
  }
};
