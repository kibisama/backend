const Item = require("../../schemas/inventory/item");
const Package = require("../../schemas/inventory/package");
const NdcDir = require("../../schemas/openFDA/ndcDir");
const createItem = require("../../services/inventory/createItem");
const updateItem = require("../../services/inventory/updateItem");
const updateLocalNdcDir = require("../../services/openFDA/updateLocalNdcDir");
const createPackage = require("../../services/inventory/createPackage");
const createAlternative = require("../../services/inventory/createAlternative");
const addToSetInventory = require("../../services/inventory/addToSetInventory");
const manageDailyOrder = require("../../services/inventory/manageDailyOrder");

module.exports = async (req, res, next) => {
  try {
    const { mode, gtin, lot, exp, sn, source, cost } = req.body;
    let item = await Item.findOne({ gtin, sn });
    if (!item) {
      item = await createItem({ gtin, lot, exp, sn });
      if (!item) {
        return next(new Error("Failed to create Item document. Please retry."));
      }
    }
    const data = await updateItem({ mode, gtin, sn, source, cost }, item);
    if (!data) {
      return next(new Error("Failed to update Item document. Please retry."));
    }

    const regEx = new RegExp(
      String.raw`${gtin.slice(3, 7)}-?${gtin[7]}-?${gtin.slice(8, 11)}-?${
        gtin[11]
      }-?${gtin[12]}`
    );
    let package = await Package.findOne({ ndc: { $regex: regEx } });
    if (package) {
      const result = await addToSetInventory(data._id, package.ndc);
      if (!result) {
        return next(
          new Error("Failed to update Package document. Please retry.")
        );
      }
      res.send({ data });
    } else {
      let ndcDir = await NdcDir.findOne({
        packaging: { $elemMatch: { description: { $regex: regEx } } },
      });
      if (!ndcDir) {
        ndcDir = await updateLocalNdcDir(gtin, "gtin");
        if (ndcDir instanceof Error && ndcDir.status === 404) {
          ndcDir = null;
        } else if (ndcDir instanceof Error || !ndcDir) {
          return res.send({
            data,
            error:
              "Failed to create or update NDC Directory document. This might occur when our Internet connection is disconnected or when the OpenFDA server is unavailable. Corresponding Package document will not be created, yet the item itself has been successfully saved in our database. If you are running Cardinal Invoice Check, this item will be recognized as a missing but extra item.",
          });
        }
      }
      package = await createPackage(ndcDir, data._id, regEx);
      if (!package) {
        return res.send({
          data,
          error: "Failed to create Package document.",
        });
      }
      const alt = await createAlternative(ndcDir, package._id);
      if (!alt) {
        return res.send({
          data,
          error:
            "Unable to create Alternative document. This usually occurs when RxCUI and/or packaging information is not defined in the OpenFDA database. You may continue scanning ignoring this.",
        });
      }

      res.send({ data });
    }
    if (mode === "FILL" && !item.dateFilled) {
      await manageDailyOrder(data, package);
    }
    return;
  } catch (e) {
    next(e);
  }
};
