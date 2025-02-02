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
    const scheduleOrder = mode === "FILL" && !item.dateFilled;
    if (!package) {
      package = await createPackage(gtin, "gtin");
      update = true;
    } else if (scheduleOrder) {
      initDailyOrder(package);
    }
    await updatePackageInventories(data, mode);
    res.send(response);
    if (update) {
      updatePackage(package, scheduleOrder ? initDailyOrder : undefined);
    }
  } catch (e) {
    next(e);
  }
};
