const dayjs = require("dayjs");
const Item = require("../../schemas/inventory/item");

module.exports = async (input, findResult) => {
  try {
    const { mode, gtin, sn, inputDate, source, cost } = input;
    const now = dayjs();
    if (findResult == null) {
      findResult = await Item.findOne({ gtin, sn });
    }
    const _inputDate = dayjs(inputDate);
    let arg;
    switch (mode) {
      case "Receive":
        arg = { $set: { dateReceived: _inputDate, source, cost } };
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
        });
      default:
        arg = {};
    }
    return await Item.findOneAndUpdate(
      {
        gtin,
        sn,
      },
      arg,
      { new: true }
    );
  } catch (e) {
    console.log(e);
  }
};
