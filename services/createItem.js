const dayjs = require("dayjs");
const customParseFormat = require("dayjs/plugin/customParseFormat");
dayjs.extend(customParseFormat);
const Item = require("../schemas/item");

module.exports = async (input) => {
  const { gtin, lot, exp, sn } = input;
  const _exp = dayjs(exp, "YYMMDD");
  return await Item.create({
    gtin,
    sn,
    lot,
    exp: _exp,
  }).catch((e) => {
    console.log(e);
    return e;
  });
};
