const NdcDir = require("../schemas/openFDA/ndcDir");
const Package = require("../schemas/package");
const addToSetInventory = require("../services/addToSetInventory");
const createAlternative = require("./createAlternative");
const convertNdcToNdc11 = require("./convertNdcToNdc11");
const convertDescriptionToSizeAndUnit = require("./convertDescriptionToSizeAndUnit");

module.exports = async (ndcDir, item_id, arg, type) => {
  let regEx;
  if (arg instanceof RegExp) {
    regEx = arg;
  } else {
    const frag = [arg.slice(3, 7), arg[7], arg.slice(8, 11), arg[11], arg[12]];
    switch (true) {
      case type === "gtin":
        regEx = new RegExp(
          String.raw`${frag[0]}-?${frag[1]}-?${frag[2]}-?${frag[3]}-?${frag[4]}`
        );
        break;
      default:
        return new Error("Invalid arguments");
    }
  }
  if (!ndcDir) {
    ndcDir = NdcDir.findOne({
      packaging: { $elemMatch: { description: { $regex: regEx } } },
    }).catch((e) => {
      console.log(e);
    });
    if (!ndcDir) {
      return new Error("Cannot find NDC Directory");
    }
  }
  if (ndcDir.packaging?.length < 1) {
    return new Error(
      "Cannot create Package Document. Packaging information is not defined in the NDC Directory document"
    );
  }
  const { _id, dosage_form } = ndcDir;
  const { unii, rxcui, nui, active_ingredients, manufacturer_name } =
    ndcDir.openfda;
  let ingredients = [];
  if (active_ingredients instanceof Array) {
    active_ingredients.forEach((v) => {
      ingredients.push(v.name);
    });
  }
  let ndc, description;
  for (let i = 0; i < ndcDir.packaging.length; i++) {
    const target = ndcDir.packaging[i].description;
    const match = target.match(regEx);
    if (match) {
      ndc = match[0];
      description = target;
      break;
    }
  }
  const [size, unit] = convertDescriptionToSizeAndUnit(description);
  const ndc11 = convertNdcToNdc11(ndc);
  const match = manufacturer_name[0].match(/([^\s,]+)/);
  let name = `${match ? match[0] + " " : ""}[${ndc11}] ${dosage_form}`;
  const package = await Package.create({
    unii,
    ingredients,
    name,
    rxcui,
    nui,
    ndc,
    ndc11,
    dosage_form,
    manufacturer_name: manufacturer_name?.[0],
    size,
    unit,
    ndcDir: _id,
  }).catch((e) => {
    console.log(e);
    return e;
  });
  if (item_id) {
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
