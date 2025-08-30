const settings = require("../../services/apps/settings");

exports.get = async (req, res) => {
  try {
    return res
      .status(200)
      .send({ code: 200, data: await settings.createPreset() });
  } catch (e) {
    console.log(e);
  }
};
exports.post = async (req, res) => {
  try {
    return res
      .status(200)
      .send({ code: 200, data: await settings.updateSettings(req.body) });
  } catch (e) {
    console.log(e);
  }
};
