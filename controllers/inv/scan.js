const item = require("../../services/inv/item");

module.exports = async (req, res, next) => {
  try {
    /** @type {item.ScanReq} */
    const scanReq = req.body;
    const { gtin, mode } = scanReq;
    const _item = await item.upsertItem(scanReq);
    const isDuplicateFill = item.isDuplicateFill(_item, mode);
    if (!isDuplicateFill) {
      await item.updateItem(scanReq);
    }
    // const _package = await package.upsertPackage(gtin, "gtin");
    // await package.updateInventories(_item, mode);
    res.sendStatus(200);
    // await package.updatePackage(_package);
    // if (item.isNewFill(_item)) {
    //   //
    // }
  } catch (e) {
    next(e);
  }
};
