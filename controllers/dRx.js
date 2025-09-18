const dRx = require("../services/dRx/dRx");

exports.getRequiredFields = (req, res) => {
  return res.status(200).send({ code: 200, data: dRx.getRequiredFields() });
};

exports.importCSV = async (req, res) => {
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
  }
};

exports.scanQR = async (req, res) => {
  try {
    const { data, station, delimiter } = req.body;
    if (typeof data !== "string") {
      return res.status(400).send({ code: 400, message: "Bad Request" });
    }
    const a = data.split(delimiter || "|").map((v) => v.trim());
    if (a.length !== 11) {
      return res.status(400).send({ code: 400, message: "Bad Request" });
    }
    const result = await dRx.upsertWithQR(a, station, new Date());
    if (result) {
      return res.status(200).send({ code: 200, data: result });
    }
    return res.status(500).send({
      code: 500,
      message: "An unexpected error occurred. Please try again.",
    });
  } catch (e) {
    console.error(e);
  }
};
