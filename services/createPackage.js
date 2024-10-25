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
  const {
    _id,
    brand_name,
    brand_name_base,
    generic_name,
    labeler_name,
    active_ingredients,
    dosage_form,
  } = ndcDir;
  const { unii, rxcui, nui, manufacturer_name } = ndcDir.openfda;
  let brandName = "";
  if (brand_name && generic_name) {
    if (brand_name.toUpperCase() !== generic_name.toUpperCase()) {
      brandName = brand_name;
    }
  }
  let ingredients = [];
  if (active_ingredients instanceof Array) {
    active_ingredients.forEach((v) => {
      ingredients.push(v.name);
    });
  }
  let ndc, description;
  for (let i = 0; i < ndcDir.packaging.length; i++) {
    const target = ndcDir.packaging[i].description;
    const target2 = ndcDir.packaging[i].package_ndc;
    const match = target.match(regEx);
    const match2 = target2.match(regEx);
    if (match && match2) {
      description = target;
      ndc = target2;
      break;
    } else if (match) {
      const newRegEx = new RegExp(
        String.raw`([^\/\n]+)(\(${regEx.toString()}\)).*`
      );
      const newMatch = target.match(newRegEx);
      if (newMatch) {
        description = newMatch[0].trim();
        ndc = match[0];
        break;
      }
    }
  }
  const [size, unit] = convertDescriptionToSizeAndUnit(description);
  let repUnit;
  let repSize = 1;
  if (size.length > 1 && unit.length > 1) {
    if (unit.includes(dosage_form)) {
      repUnit = dosage_form;
    } else {
      repUnit = unit[unit.length - 2];
    }
    const unitIndex = unit.indexOf(repUnit);
    for (let i = 0; i < unitIndex + 2; i++) {
      if (i % 2) {
        repSize /= size[i];
      } else {
        repSize *= size[i];
      }
    }
  }
  const ndc11 = convertNdcToNdc11(ndc);

  // Default name generation
  let _manufacturer_name = manufacturer_name
    ? manufacturer_name[0]
    : labeler_name;
  let mfrName;
  const match = _manufacturer_name.match(/([^\s,]+)/);
  if (match && match[0].length > 2) {
    mfrName = match[0];
  }
  let desc = "";
  if (repSize && repUnit) {
    desc += repSize.toString() + " " + repUnit;
  }
  const name = `${ndc11} | ${mfrName ?? _manufacturer_name}${
    brandName ? " | " + brandName : ""
  }${desc ? " | " + desc : ""}`;

  const package = await Package.create({
    brand_name: brand_name_base ?? brand_name,
    unii,
    ingredients,
    name,
    rxcui,
    nui,
    ndc,
    ndc11,
    manufacturer_name: _manufacturer_name,
    size,
    repSize,
    unit,
    repUnit,
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
