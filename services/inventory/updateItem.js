const dayjs = require("dayjs");
const Item = require("../../schemas/inventory/item");

/*
Updates an Item document.
Returns: Item | undefined
*/
module.exports = async (input, findResult) => {
  try {
    const { mode, gtin, sn, source, cost } = input;
    const now = dayjs();
    if (findResult == null) {
      findResult = await Item.findOne({ gtin, sn });
    }
    let arg;
    switch (mode) {
      case "RECEIVE":
        arg = { $set: { dateReceived: now, source, cost } };
        break;
      case "FILL":
        if (findResult.dateFilled) {
          return findResult;
        }
        arg = { $set: { dateFilled: now } };
        break;
      case "REVERSE":
        arg = { $set: { dateReversed: now }, $unset: { dateFilled: 1 } };
        break;
      case "RETURN":
        arg = { $set: { dateReturned: now } };
        break;
      case "DELETE":
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
