const settings = require("../../services/apps/settings");

exports.get = async (req, res, next) => res.send(settings.getSettings());

exports.post = async (req, res, next) => {
  try {
    return res.send(await settings.updateSettings(req.body));
  } catch (error) {
    next(error);
  }
};
