const dayjs = require("dayjs");
const CardinalInvoice = require("../../schemas/cardinal/cardinalInvoice");

module.exports = async (req, res, next) => {
  try {
    const date = dayjs(req.params.date, "MM-DD-YYYY");
    const dateStart = date.startOf("date");
    const dateEnd = date.endOf("date");
    const results = await CardinalInvoice.find({
      invoiceDate: { $gte: dateStart, $lte: dateEnd },
    });
    // run evalInvoice
    return res.send(results);
  } catch (e) {
    console.log(e);
    next(e);
  }
};
