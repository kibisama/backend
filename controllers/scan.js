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
  const { mode, gtin, lot, exp, sn, inputDate, source, offLineMode } = req.body;
  const now = dayjs();
  const result = await Item.findOne({ gtin, sn }).catch((e) => {
    console.log(e);
    next(e);
  });
  let result0;
  if (!result) {
    result0 = await createItem({ gtin, lot, exp, sn, inputDate, source });
    if (result0 instanceof Error) {
      next(result0);
    }
  }
  const data = await updateItem(
    { mode, gtin, sn, inputDate, source },
    now,
    result ?? result0
  );
  if (data instanceof Error) {
    next(data);
  }
  if (result) {
    return res.send({
      data,
    });
  }

  const _ndc = [
    gtin.slice(3, 7),
    gtin[7],
    gtin.slice(8, 11),
    gtin[11],
    gtin[12],
  ];
  const regEx = new RegExp(
    String.raw`${_ndc[0]}-?${_ndc[1]}-?${_ndc[2]}-?${_ndc[3]}-?${_ndc[4]}`
  );
  const result1 = await Package.findOne({ ndc: { $regex: regEx } }).catch(
    (e) => {
      console.log(e);
      next(e);
    }
  );
  if (result1) {
    const result = await addToSetInventory(data._id, result1.ndc);
    if (result instanceof Error) {
      next(result);
    }
    return res.send({ data });
  }
  let result2 = await NdcDir.findOne({
    packaging: { $elemMatch: { package_ndc: { $regex: regEx } } },
  }).catch((e) => {
    console.log(e);
    next(e);
  });
  if (offLineMode && !result2) {
    return res.send({
      data,
      error:
        "Package nor NDC Directory document is not found, and cannot create due to Offline Mode.",
    });
  } else if (!result2) {
    const query = `${_ndc[0]}*${_ndc[1]}*${_ndc[2]}*${_ndc[3]}*${_ndc[4]}`;
    result2 = await updateLocalNdcDir(query);
    if (result2 instanceof Error) {
      return res.send({
        data,
        error: result2.message,
      });
    }
  }
  const result3 = await createPackage(regEx, result2, null, data._id);
  if (result3 instanceof Error) {
    return res.send({
      data,
      error: result3.message,
    });
  }
  return res.send({ data });
};
