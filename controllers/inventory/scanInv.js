const Item = require("../../schemas/inventory/item");
const Package = require("../../schemas/inventory/package");
const createItem = require("../../services/inventory/createItem");
const updateItem = require("../../services/inventory/updateItem");
const createPackage = require("../../services/inventory/createPackage");
const updatePackageInventories = require("../../services/inventory/updatePackageInventories");
const initDailyOrder = require("../../services/inventory/initDailyOrder");

module.exports = async (req, res, next) => {
  try {
    const body = req.body;
    const { mode, gtin, sn } = body;
    let item = await Item.findOne({ gtin, sn });
    if (!item) {
      item = await createItem(body);
      if (!item) {
        return next(new Error("Failed to find or create Item document"));
      }
    }
    const data = await updateItem(body, item);
    if (!data) {
      return next(new Error("Failed to update Item document"));
    }
    const response = { data };
    let package = await Package.findOne({ gtin });
    if (!package) {
      package = await createPackage(gtin);
      if (!package) {
        return next(new Error("Failed to create Package document"));
      }
    }
    res.send(response);
    await updatePackageInventories(data, mode);
    if (mode === "FILL" && !item.dateFilled) {
      initDailyOrder(package, data);
    }
  } catch (e) {
    next(e);
  }
};
