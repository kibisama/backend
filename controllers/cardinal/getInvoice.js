const dayjs = require("dayjs");
const CardinalInvoice = require("../../schemas/cardinal/cardinalInvoice");
const evalInvoice = require("../../services/cardinal/evalInvoice");

module.exports = async (req, res, next) => {
  try {
    const date = dayjs(req.params.date, "MM-DD-YYYY");
    const dateStart = date.startOf("date");
    const dateEnd = date.endOf("date");
    const results = await CardinalInvoice.find(
      {
        invoiceDate: { $gte: dateStart, $lte: dateEnd },
      },
      { _id: 0, invoiceNumber: 1 }
    );
    const { duplicatesWithDifferentPrices } = evalInvoice(date);
    return res.send({
      invoiceNumber: results.map((v) => v.invoiceNumber),
      duplicatesWithDifferentPrices,
    });
  } catch (e) {
    console.log(e);
    next(e);
  }
};
