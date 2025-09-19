const inventory = require("../services/inv/inventory");

exports.getAlternatives = async (req, res, next) => {
  try {
    const data = await inventory.getAlternatives();
    return res.status(200).send({
      code: 200,
      data,
    });
  } catch (e) {
    console.error(e);
    next(e);
  }
};

exports.getInventories = async (req, res, next) => {
  try {
    const { _id, sort, filled } = req.query;
    if (!_id) {
      return res.status(400).send({ code: 400, message: "Bad Request" });
    }
    const data = await inventory.getInventories(
      _id,
      sort,
      filled === "true" && true
    );
    if (data) {
      return res.status(200).send({ code: 200, data });
    }
    return res.status(404).send({ code: 404 });
  } catch (e) {
    console.error(e);
    next(e);
  }
};

exports.getUsages = async (req, res, next) => {
  try {
    const { date } = req.params;
    const data = await inventory.getUsages(date);
    return res.status(200).send({ code: 200, data });
  } catch (e) {
    console.error(e);
    next(e);
  }
};
