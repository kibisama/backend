//////////////////////////////// under working
const Drug = require("../../schemas/inventory/drug");
const Alternative = require("../../schemas/inventory/alternative");
const Package = require("../../schemas/inventory/package");
const Item = require("../../schemas/inventory/item");
module.exports = async (req, res, next) => {
  const { id, hierarchy, name, optimalQty, preferred } = req.body;
  switch (hierarchy) {
    case 0:
      await Drug.findOneAndUpdate(
        { _id: id },
        { $set: { name } },
        { new: true }
      ).catch((e) => {
        console.log(e);
        next(e);
      });
      break;
    case 1:
      await Alternative.findOneAndUpdate(
        { _id: id },
        { $set: { name } },
        { new: true }
      ).catch((e) => {
        console.log(e);
        next(e);
      });
      break;
    case 2:
      await Package.findOneAndUpdate(
        { _id: id },
        { $set: { name, optimalQty, preferred } },
        { new: true }
      ).catch((e) => {
        console.log(e);
        next(e);
      });
      break;
    default:
      return res.sendStatus(500);
  }
  return res.sendStatus(200);
};
