const Package = require("../schemas/package");
const addToSetInventory = require("../services/addToSetInventory");
const createAlternative = require("./createAlternative");
const convertNdcToNdc11 = require("./convertNdcToNdc11");
const convertDescriptionToSizeAndUnit = require("./convertDescriptionToSizeAndUnit");

module.exports = async (arg, ndcDir, type, item_id) => {
  let regEx;
  if (arg instanceof RegExp) {
    regEx = arg;
  } else {
    switch (true) {
      case type === "ndc":
        regEx = new RegExp(String.raw`${arg}`);
        break;
      case type === "gtin":
        regEx = new RegExp(
          String.raw`${arg.slice(3, 7)}-?${arg[7]}-?${arg.slice(8, 11)}-?${
            arg[11]
          }-?${arg[12]}`
        );
        break;
      default:
        return new Error("Invalid arguments");
    }
  }

  if (ndcDir == null) {
    ndcDir = await Package.findOne({ ndc: { $regex: regEx } }).catch((e) => {
      console.log(e);
      return e;
    });
    if (ndcDir == null) {
      return new Error("Cannot find NDC Directory");
    }
  }
  const { _id, dosage_form } = ndcDir;
  const { manufacturer_name } = ndcDir.openfda;
  let ndc, description;
  for (let i = 0; i < ndcDir.packaging.length; i++) {
    const target = ndcDir.packaging[i].package_ndc;
    if (target === target.match(regEx)[0]) {
      ndc = target;
      description = ndcDir.packaging[i].description;
      break;
    }
  }
  const [size, unit] = convertDescriptionToSizeAndUnit(description);
  const ndc11 = convertNdcToNdc11(ndc);
  const package = await Package.create({
    ndc,
    ndc11,
    dosage_form,
    manufacturer_name: manufacturer_name[0],
    size,
    unit,
    ndcDir: _id,
  }).catch((e) => {
    console.log(e);
    return e;
  });
  if (item_id != null) {
    const result = await addToSetInventory(item_id, ndc);
    if (result instanceof Error) {
      return result;
    }
  }
  const alt = await createAlternative(ndcDir, package._id);
  if (alt instanceof Error) {
    return alt;
  }
  return package;
};
