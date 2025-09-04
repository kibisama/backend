const item = require("../../services/inv/item");
const package = require("../../services/inv/package");
// const dailyOrder = require("../../services/inv/dailyOrder");

exports.post = async (req, res, next) => {
  try {
    /** @type {item.ScanReq} */
    const scanReq = req.body;
    const { gtin, mode } = scanReq;
    const _package = await package.upsertPackage(gtin, "gtin");
    if (!_package) {
      res
        .status(422)
        .send({ code: 422, message: "Unable to create a Package document." });
    }
    const _item = await item.upsertItem(scanReq, "SCAN");
    switch (mode) {
      case "FILL":
        if (_item.dateFilled) {
          return res.status(208).send({
            code: 208,
            message: "The item has been already reported as filled.",
          });
        }
        //
        break;
      case "RECEIVE":
        if (_item.dateReceived) {
          return res.status(208).send({
            code: 208,
            message: "The item has been already reported as received.",
          });
        }
        //
        break;
      case "RETURN":
        //
        break;
      default:
    }
    await item.updateItem(scanReq, new Date(), _item);
    await package.updateInventories(_item, mode);
    res.status(200).send({
      code: 200,
      message: "The inventory has been successfully updated.",
    });

    // if (mode === "RETURN") {
    //   const result = item.preprocessReturn(_item);
    //   if (result.code === 200) {
    //     await item.updateItem(scanReq);
    //   } else {
    //     //
    //   }
    // } else {
    //   await item.updateItem(scanReq);
    // }
    /** @type {package.UpdateOption} */
    // const option = item.isNewFill(_item, mode)
    //   ? { callback: dailyOrder.upsertDO }
    //   : mode !== "RETURN"
    //   ? {
    //       callback: async (package) => {
    //         await dailyOrder.updateAltDOs(package);
    //         const dO = await dailyOrder.findDO(package);
    //         dO && (await dailyOrder.updateFilledItems(dO, gtin));
    //       },
    //     }
    //   : undefined;

    // return res.sendStatus(200);
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .send({ code: 500, message: "An unexpected error occurred." });
  }
};
