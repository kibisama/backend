const dRx = require("../services/dRx/dRx");
const pt = require("../services/dRx/patient");

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
          message: "Internal Server Error",
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

exports.getPatients = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).send({ code: 400, message: "Bad Request" });
    }
    const data = await pt.findPatient(q);
    if (!data) {
      return res.status(500).send({
        code: 500,
        message: "Internal Server Error",
      });
    } else if (data.length === 0) {
      return res.status(404).send({ code: 404, message: "Not Found" });
    }
    return res.status(200).send({ code: 200, data });
  } catch (e) {
    console.error(e);
    next(e);
  }
};
