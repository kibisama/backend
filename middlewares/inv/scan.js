const Inventory = require("../../schemas/inventory");
const dayjs = require("dayjs");
const customParseFormat = require("dayjs/plugin/customParseFormat");
dayjs.extend(customParseFormat);

const scan = async (req, res, next) => {
  const { mode, gtin, lot, exp, sn, inputDate, source } = req.body;
  const _inputDate = dayjs(inputDate);
  const _exp = dayjs(exp, "YYMMDD");
  const now = dayjs();
  let result = await Inventory.findOne({ gtin, sn });
  if (!result) {
    result = await Inventory.create({
      gtin,
      sn,
      lot,
      exp: _exp,
    }).catch((e) => {
      console.log(e);
    });
  }
  let arg;

  switch (mode) {
    case "Receive":
      arg = { $set: { dateReceived: _inputDate, source } };
      const oneYearFromNow = now.add(1, "y");
      if (_exp.isBefore(oneYearFromNow)) {
        return res.send({
          error: 1,
          data: await Inventory.findOneAndUpdate(
            {
              gtin,
              sn,
            },
            arg,
            { new: true }
          ).catch((e) => {
            console.log(e);
          }),
        });
      }
      break;
    case "Fill":
      if (result.dateFilled) {
        return res.send(result);
      }
      arg = { $set: { dateFilled: now } };
      break;
    case "Reverse":
      arg = { $set: { dateReversed: now }, $unset: { dateFilled: 1 } };
      break;
    case "Return":
      arg = { $set: { dateReturned: now } };
      break;
    default:
      return res.sendStatus(500);
  }
  result = await Inventory.findOneAndUpdate(
    {
      gtin,
      sn,
    },
    arg,
    { new: true }
  ).catch((e) => {
    console.log(e);
  });
  return res.send(result);
};

module.exports = scan;
