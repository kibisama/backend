const Package = require("../schemas/package");
const Item = require("../schemas/item");

module.exports = async (_id, ndc) => {
  if (!ndc) {
    const { gtin } = await Item.findById(_id).catch((e) => {
      console.log(e);
    });
    const _ndc = [
      gtin.slice(3, 7),
      gtin[7],
      gtin.slice(8, 11),
      gtin[11],
      gtin[12],
    ];
    const regEx = new RegExp(
      String.raw`${_ndc[0]}-?${_ndc[1]}-?${_ndc[2]}-?${_ndc[3]}-?${_ndc[4]}`
    );
    const result = await Package.findOne({ ndc: { $regex: regEx } }).catch(
      (e) => {
        console.log(e);
      }
    );
    ndc = result.ndc;
  }
  if (!ndc) {
    return new Error("Cannot find Package Document");
  }
  return await Package.findOneAndUpdate(
    {
      ndc,
    },
    { $addToSet: { inventories: _id } },
    { new: true }
  ).catch((e) => {
    console.log(e);
    return e;
  });
};
