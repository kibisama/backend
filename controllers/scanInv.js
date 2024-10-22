const dayjs = require("dayjs");
const Item = require("../schemas/item");
const Package = require("../schemas/package");
const NdcDir = require("../schemas/openFDA/ndcDir");
const createItem = require("../services/createItem");
const updateItem = require("../services/updateItem");
const updateLocalNdcDir = require("../services/updateLocalNdcDir");
const createPackage = require("../services/createPackage");
const addToSetInventory = require("../services/addToSetInventory");

module.exports = async (req, res, next) => {
  const { mode, gtin, lot, exp, sn, inputDate, source } = req.body;
  const now = dayjs();
  const item = await Item.findOne({ gtin, sn }).catch((e) => {
    console.log(e);
    next(e);
  });
  let _item;
  if (!item) {
    _item = await createItem({ gtin, lot, exp, sn, inputDate, source });
    if (_item instanceof Error) {
      next(_item);
    }
  }
  const data = await updateItem(
    { mode, gtin, sn, inputDate, source },
    now,
    item ?? _item
  );
  if (data instanceof Error) {
    next(data);
  }
  if (item) {
    return res.send({
      data,
    });
  }

  const regEx = new RegExp(
    String.raw`${gtin.slice(3, 7)}-?${gtin[7]}-?${gtin.slice(8, 11)}-?${
      gtin[11]
    }-?${gtin[12]}`
  );
  let package = await Package.findOne({ ndc: { $regex: regEx } }).catch((e) => {
    console.log(e);
    next(e);
  });
  if (package) {
    const result = await addToSetInventory(data._id, package.ndc);
    if (result instanceof Error) {
      next(result);
    }
    return res.send({ data });
  }

  let ndcDir = await NdcDir.findOne({
    packaging: { $elemMatch: { description: { $regex: regEx } } },
  }).catch((e) => {
    console.log(e);
    next(e);
  });
  if (!ndcDir) {
    ndcDir = await updateLocalNdcDir(gtin, "gtin");
    if (ndcDir instanceof Error) {
      // todo: scheduleJob to try later
      return res.send({
        data,
        //
        error: ndcDir.message,
        //
      });
    }
  }
  package = await createPackage(ndcDir, data._id, regEx);
  if (package instanceof Error) {
    return res.send({
      data,
      //
      error: package.message,
      //
    });
  }
  return res.send({ data });
};
