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
    if (results.length > 0) {
      const {
        duplicatesWithDifferentPrices,
        backorderedItems,
        differentQtyShipped,
        invoiceTotalShipped,
        invoiceTotalAmount,
      } = await evalInvoice(dateParam);
      return res.send({
        invoiceNumbers: results.map((v) => v.invoiceNumber),
        duplicatesWithDifferentPrices,
        backorderedItems,
        differentQtyShipped,
        invoiceTotalShipped,
        invoiceTotalAmount,
      });
    }
    return res.sendStatus(404);
  } catch (e) {
    console.log(e);
    next(e);
  }
};
