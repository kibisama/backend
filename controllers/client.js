const { getUsers } = require("../api/client");

exports.getUsers = async (req, res, next) => {
  try {
    const { data } = await getUsers();
    return res.status(200).send({ code: 200, data });
  } catch (e) {
    console.error(e);
    next(e);
  }
};
