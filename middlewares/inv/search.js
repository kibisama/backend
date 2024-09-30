const Inventory = require("../../schemas/inventory");
const dayjs = require("dayjs");
const createInvTable = require("../../services/createInvTable");

const search = async (req, res, next) => {
  let _result;
  if (Object.keys(req.body).length === 0) {
    const startOfToday = dayjs().startOf("d");
    const endOfToday = dayjs().endOf("d");
    _result = await Inventory.find({
      $or: [
        { dateFilled: { $gte: startOfToday, $lte: endOfToday } },
        { dateFilled: undefined },
      ],
    });
  }
  const result = createInvTable(_result);
  res.send(result);
};

module.exports = search;
