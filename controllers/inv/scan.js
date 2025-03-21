const item = require("../../services/inv/item");
const package = require("../../services/inv/package");

module.exports = async (req, res, next) => {
  try {
    /** @type {item.ScanReq} */
    const scanReq = req.body;
    const { gtin, mode } = scanReq;
    const _item = await item.upsertItem(scanReq);
    if (!item.isDuplicateFill(_item, mode)) {
      await item.updateItem(scanReq);
    }
    const pkg = await package.upsertPackage(gtin, "gtin");
    await package.updateInventories(_item, mode);
    res.sendStatus(200);
    await package.updatePackage(pkg);
    // if (item.isNewFill(_item)) {
    //   //
    // }
  } catch (e) {
    next(e);
  }
};
