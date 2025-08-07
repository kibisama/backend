const item = require("../../services/inv/item");
const package = require("../../services/inv/package");
const dailyOrder = require("../../services/inv/dailyOrder");

module.exports = async (req, res, next) => {
  try {
    /** @type {item.ScanReq} */
    const scanReq = req.body;
    const { gtin, mode } = scanReq;
    const _item = await item.upsertItem(scanReq, "SCAN");
    if (item.isDuplicateFill(_item, mode)) {
      return res.sendStatus(208);
    }
    if (mode === "RETURN") {
      const result = item.preprocessReturn(_item);
      if (result.code === 200) {
        await item.updateItem(scanReq);
      } else {
        //
      }
    } else {
      await item.updateItem(scanReq);
    }
    /** @type {package.UpdateOption} */
    const option = item.isNewFill(_item, mode)
      ? { callback: dailyOrder.upsertDO }
      : mode !== "RETURN"
      ? {
          callback: async (package) => {
            await dailyOrder.updateAltDOs(package);
            const dO = await dailyOrder.findDO(package);
            dO && (await dailyOrder.updateFilledItems(dO, gtin));
          },
        }
      : undefined;
    const pkg = await package.upsertPackage(gtin, "gtin", option);
    if (!pkg) {
      //
      return res.sendStatus(500);
    }
    await package.updateInventories(_item, mode);
    return res.sendStatus(200);
  } catch (e) {
    next(e);
  }
};
