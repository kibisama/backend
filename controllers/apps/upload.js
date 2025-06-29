const dRx = require("../../services/dRx/dRx");

exports.checkDRxCSV = async (req, res) => {
  try {
    if (dRx.checkCSVHeader(req.body.csvHeader)) {
      return res.sendStatus(200);
    }
    res.sendStatus(406);
  } catch (e) {
    console.log(e);
  }
};
