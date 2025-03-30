const item = require("../../services/inv/item");
const package = require("../../services/inv/package");
const dailyOrder = require("../../services/inv/dailyOrder");

module.exports = async (req, res, next) => {
  try {
    /** @type {item.ScanReq} */
    const scanReq = req.body;
    const { gtin, mode } = scanReq;
    const _item = await item.upsertItem(scanReq);
    if (!item.isDuplicateFill(_item, mode)) {
      await item.updateItem(scanReq);
    }
    /** @type {Parameters<package["upsertPackage"]>["2"]} */
    const option = item.isNewFill(_item)
      ? { callback: dailyOrder.upsertDO }
      : undefined;
    await package.upsertPackage(gtin, "gtin", option);
    await package.updateInventories(_item, mode);
    res.sendStatus(200);
  } catch (e) {
    next(e);
  }
};
