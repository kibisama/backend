const dayjs = require("dayjs");
const Item = require("../schemas/item");

module.exports = async (input, now = dayjs(), findResult) => {
  const { mode, gtin, sn, inputDate, source } = input;
  if (findResult == null) {
    findResult = await Item.findOne({ gtin, sn }).catch((e) => {
      console.log(e);
      return e;
    });
  }
  const _inputDate = dayjs(inputDate);
  let arg;
  switch (mode) {
    case "Receive":
      arg = { $set: { dateReceived: _inputDate, source } };
      break;
    case "Fill":
      if (findResult.dateFilled) {
        return findResult;
      }
      arg = { $set: { dateFilled: now } };
      break;
    case "Reverse":
      arg = { $set: { dateReversed: now }, $unset: { dateFilled: 1 } };
      break;
    case "Return":
      arg = { $set: { dateReturned: now } };
      break;
    case "Delete":
      return await Item.deleteOne({
        gtin,
        sn,
      }).catch((e) => {
        console.log(e);
        return e;
      });
    default:
      arg = {};
  }
  const result = await Item.findOneAndUpdate(
    {
      gtin,
      sn,
    },
    arg,
    { new: true }
  ).catch((e) => {
    console.log(e);
    return e;
  });
  return result;
};
