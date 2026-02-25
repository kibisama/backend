const settings = require("../../services/apps/settings");

exports.get = async (req, res, next) => {
  try {
    return res.send(await settings.getSettings());
  } catch (error) {
    next(error);
  }
};
exports.post = async (req, res, next) => {
  try {
    return res
      .status(200)
      .send({ code: 200, data: await settings.updateSettings(req.body) });
  } catch (e) {
    console.error(e);
    next(e);
  }
};
