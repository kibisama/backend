const Item = require("../../schemas/inventory/item");
const Package = require("../../schemas/inventory/package");
const NdcDir = require("../../schemas/openFDA/ndcDir");
const createItem = require("../../services/inventory/createItem");
const updateItem = require("../../services/inventory/updateItem");
const updateLocalNdcDir = require("../../services/openFDA/updateLocalNdcDir");
const createPackage = require("../../services/inventory/createPackage");
const createAlternative = require("../../services/inventory/createAlternative");
const addToSetPackage = require("../../services/inventory/addToSetPackage");
const initDailyOrder = require("../../services/inventory/initDailyOrder");

module.exports = async (req, res, next) => {
  try {
    const { mode, gtin, lot, exp, sn, source, cost } = req.body;
    let item = await Item.findOne({ gtin, sn });
    if (!item) {
      item = await createItem({ gtin, lot, exp, sn });
      if (!item) {
        return next(new Error("Failed to create Item document."));
      }
    }
    const data = await updateItem({ mode, gtin, sn, source, cost }, item);
    if (!data) {
      return next(new Error("Failed to update Item document."));
    }
    const response = { data };
    let package = await Package.findOne({ gtin });
    if (package) {
      const result = await addToSetPackage(data);
      if (!result) {
        next(new Error("Failed to update Package document."));
      }
    } else {
      const regEx = new RegExp(
        String.raw`${gtin.slice(3, 7)}-?${gtin[7]}-?${gtin.slice(8, 11)}-?${
          gtin[11]
        }-?${gtin[12]}`
      );
      let ndcDir = await NdcDir.findOne({
        packaging: { $elemMatch: { description: { $regex: regEx } } },
      });
      if (!ndcDir) {
        ndcDir = await updateLocalNdcDir(gtin, "gtin");
        if (ndcDir instanceof Error && ndcDir.status === 404) {
          ndcDir = null;
        } else if (ndcDir instanceof Error || !ndcDir) {
          response.error = "Failed to create or update NDC Directory document.";
          res.send({
            response,
          });
          if (mode === "FILL" && !item.dateFilled) {
            await initDailyOrder(data);
          }
          return;
        }
      }
      package = await createPackage(ndcDir, data, regEx);
      if (package) {
        const alt = await createAlternative(ndcDir, package);
        if (!alt) {
          response.error = "Failed to create Alternative document.";
        }
      } else {
        response.error = "Failed to create Package document.";
      }
    }
    res.send(response);
    if (mode === "FILL" && !item.dateFilled) {
      await initDailyOrder(data, package);
    }
    return;
  } catch (e) {
    next(e);
  }
};
