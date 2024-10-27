const Package = require("../../schemas/inventory/package");
const Item = require("../../schemas/inventory/item");

module.exports = async (_id, ndc) => {
  try {
    if (!ndc) {
      const { gtin } = await Item.findById(_id);
      if (!gtin) {
        return;
      }
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
      const result = await Package.findOne({ ndc: { $regex: regEx } });
      ndc = result.ndc;
    }
    if (!ndc) {
      return;
    }
    return await Package.findOneAndUpdate(
      {
        ndc,
      },
      { $addToSet: { inventories: _id } },
      { new: true }
    );
  } catch (e) {
    console.log(e);
  }
};
