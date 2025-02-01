const { Item, Package } = require("../../schemas/inventory");
const createItem = require("../../services/inventory/item/createItem");
const updateItem = require("../../services/inventory/item/updateItem");
const createPackage = require("../../services/inventory/package/createPackage");
const updatePackage = require("../../services/inventory/package/updatePackage");
const updatePackageInventories = require("../../services/inventory/package/updatePackageInventories");
const initDailyOrder = require("../../services/inventory/dailyOrder/initDailyOrder");

module.exports = async (req, res, next) => {
  try {
    const body = req.body;
    const { mode, gtin, lot, sn } = body;
    let item = await Item.findOne({ gtin, lot, sn });
    if (!item) {
      item = await createItem(body);
    }
    const data = await updateItem(body, item);
    const response = { data };
    let package = await Package.findOne({ gtin });
    let update = false;
    if (!package) {
      package = await createPackage(gtin, "gtin");
      update = true;
    }
    res.send(response);
    await updatePackageInventories(data, mode);
    if (update) {
      updatePackage(
        package,
        mode === "FILL" && !item.dateFilled ? initDailyOrder : undefined
      );
    }
  } catch (e) {
    next(e);
  }
};
