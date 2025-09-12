const item = require("../../services/inv/item");
const package = require("../../services/inv/package");
const cahProduct = require("../../services/cah/cahProduct");

exports.post = async (req, res, next) => {
  try {
    /** @type {item.ScanReq} **/
    const scanReq = req.body;
    const { gtin, mode, sn, lot, exp } = scanReq;
    if (!(mode && gtin && sn && lot && exp)) {
      return res.status(400).send({ code: 400, message: "Bad Request" });
    }
    const _package = await package.upsertPackage(gtin, "gtin");
    if (!_package) {
      res
        .status(422)
        .send({ code: 422, message: "Unable to create a Package document." });
    }
    const _item = await item.upsertItem(scanReq, "SCAN");
    /** @type {import("../../services/common").Response} **/
    let response;
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
        const _response = item.preprocessReturn(_item);
        const { code } = _response;
        if (code === 200 || code === 202) {
          response = _response;
        } else {
          return res.status(code).send(_response);
        }
        break;
      default:
    }
    await item.updateItem(scanReq, new Date(), _item);
    await package.updateInventories(_item, mode);
    res.status(200).send({
      code: 200,
      message: "The inventory has been successfully updated.",
    });
    if (_package.cahProduct) {
      await _package.populate("cahProduct");
      cahProduct.updateProduct(_package.cahProduct);
    }
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .send({ code: 500, message: "An unexpected error occurred." });
  }
};
