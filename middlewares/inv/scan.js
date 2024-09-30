const Inventory = require("../../schemas/inventory");
const parseDataMatrix = require("../../services/parseDataMatrix");
const dayjs = require("dayjs");
const customParseFormat = require("dayjs/plugin/customParseFormat");
dayjs.extend(customParseFormat);

const scan = async (req, res, next) => {
  const { mode, dataMatrix, inputDate, source } = req.body;
  const { gtin, lot, exp, sn } = parseDataMatrix(dataMatrix);
  if (!gtin | !lot | !exp | !sn) {
    return res.sendStatus(500);
  }
  const _inputDate = dayjs(inputDate);
  const _exp = dayjs(exp, "YYMMDD");

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

  switch (mode) {
    case "Receive":
      result = await Inventory.updateOne(
        {
          gtin,
          sn,
        },
        { $set: { dateReceived: _inputDate, source } }
      ).catch((e) => {
        console.log(e);
      });
      break;
    case "Fill":
      if (!result.dateFilled) {
        result = await Inventory.updateOne(
          {
            gtin,
            sn,
          },
          { $set: { dateFilled: dayjs() } }
        ).catch((e) => {
          console.log(e);
        });
      }
      break;
    case "Reverse":
      result = await Inventory.updateOne(
        {
          gtin,
          sn,
        },
        { $set: { dateReversed: dayjs() }, $unset: { dateFilled: 1 } }
      ).catch((e) => {
        console.log(e);
      });
      break;
    case "Return":
      result = await Inventory.updateOne(
        {
          gtin,
          sn,
        },
        { $set: { dateReturned: dayjs() } }
      ).catch((e) => {
        console.log(e);
      });
      break;
    default:
  }
  return res.send(result);
};

module.exports = scan;
