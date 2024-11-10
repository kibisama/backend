const puppet = require("../../api/puppet");
const createInvoice = require("../../services/cardinal/createInvoice");

module.exports = async (req, res, next) => {
  try {
    const date = req.params.date.replaceAll("-", "/");
    const result = await puppet.cardinal.getInvoice({
      date,
    });
    if (result instanceof Error && result.status === 503) {
      return res.send({ error: 11 });
    } else if (result instanceof Error) {
      return next(result);
    } else {
      const { invoiceDetails } = result.data.results;
      if (invoiceDetails.length > 0) {
        for (const invoiceDetail of invoiceDetails) {
          await createInvoice(invoiceDetail);
        }
      }
      next();
    }
  } catch (e) {
    next(e);
  }
};
