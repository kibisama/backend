const dRx = require("../services/dRx/dRx");

exports.getRequiredFields = (req, res) => {
  return res.status(200).send({ code: 200, data: dRx.getRequiredFields() });
};

exports.importCSV = async (req, res, next) => {
  try {
    const { data } = req.body;
    if (data.length > 0 && dRx.verifyFields(data[0])) {
      const n = await dRx.importDRxs(data);
      if (n !== data.length - 1) {
        //
        return res.status(500).send({
          code: 500,
          message: "An unexpected error occurred. Please try again.",
        });
      }
      // update last update history
      return res.status(200).send({
        code: 200,
        message: `Total ${n} Rx(s) have been uploaded.`,
      });
    } else {
      return res.status(400).send({ code: 400, message: "Bad Request" });
    }
  } catch (e) {
    console.error(e);
    next(e);
  }
};
