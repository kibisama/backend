const Package = require("../../schemas/inventory/package");
const ProductLabeling = require("../../schemas/openFDA/productLabeling");
const convertNdcToNdc11 = require("../functions/convertNdcToNdc11");
const convertDescriptionToSizeAndUnit = require("../functions/convertDescriptionToSizeAndUnit");

/*
Creates a Package document based on NDC Directory.
If a NdcDir document is not passed, it will search local db for a reference product and create a minimal document. 
Returns: Package | undefined
*/
module.exports = async (ndcDir, item_id, arg, type) => {
  try {
    let regEx;
    if (arg instanceof RegExp) {
      regEx = arg;
    } else {
      switch (true) {
        case type === "gtin":
          const frag = [
            arg.slice(3, 7),
            arg[7],
            arg.slice(8, 11),
            arg[11],
            arg[12],
          ];
          regEx = new RegExp(
            String.raw`${frag[0]}-?${frag[1]}-?${frag[2]}-?${frag[3]}-?${frag[4]}`
          );
          break;
        default:
          return;
      }
    }
    if (!ndcDir) {
      const source = regEx.source;
      const ndc = source.replace(/[^0-9]+/g, "");
      const regex = source.substring(0, 12) + `(${source[14]}|$)`;
      const reference = await ProductLabeling.findOne({
        "openfda.original_packager_product_ndc": { $regex: regex },
      });
      if (!reference) {
        return;
      }
      const { brand_name, generic_name, original_packager_product_ndc } =
        reference.openfda;
      let _ndc = "";
      if (original_packager_product_ndc[0].length === 9) {
        _ndc = original_packager_product_ndc[0] + "-" + ndc.substring(8, 10);
      } else if (original_packager_product_ndc[0].length === 10) {
        _ndc = original_packager_product_ndc[0] + "-" + ndc[9];
      }
      const ndc11 = convertNdcToNdc11(_ndc);
      const name = `${ndc11}${
        brand_name
          ? " | " + brand_name[0]
          : generic_name
          ? " | " + generic_name[0]
          : ""
      }`;
      const query = {
        name,
        ndc: _ndc,
        ndc11,
      };
      if (item_id) {
        query.inventories = [item_id];
      }
      return await Package.create(query);
    }

    if (ndcDir.packaging?.length < 1) {
      return;
    }
    const {
      _id,
      brand_name,
      brand_name_base,
      generic_name,
      labeler_name,
      product_type,
      dosage_form,
    } = ndcDir;
    const { unii, rxcui, nui, manufacturer_name } = ndcDir.openfda;
    let brandName = "";
    if (brand_name && generic_name) {
      if (brand_name.toUpperCase() !== generic_name.toUpperCase()) {
        brandName = brand_name;
      }
    }

    let ndc,
      description = "";
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
        const newRegEx = new RegExp(String.raw`([^\/]+)\(${regEx.source}\).*`);
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
    let _manufacturer_name = manufacturer_name
      ? manufacturer_name[0]
      : labeler_name;
    let mfrName;
    const match = _manufacturer_name.match(/([^\s,]+)/);
    if (match && match[0].length > 3) {
      mfrName = match[0];
    }
    let desc = "";
    if (repSize && repUnit) {
      desc += repSize.toString() + " " + repUnit;
    }
    const name = `${ndc11} | ${mfrName ?? _manufacturer_name}${
      brandName ? " | " + brandName : ""
    }${desc ? " | " + desc : ""}`;

    const query = {
      brand_name: brand_name_base ?? brand_name,
      unii,
      name,
      rxcui,
      nui,
      ndc,
      ndc11,
      manufacturer_name: _manufacturer_name,
      product_type,
      size,
      repSize,
      unit,
      repUnit,
      ndcDir: _id,
    };
    if (item_id) {
      query.inventories = [item_id];
    }
    return await Package.create(query);
  } catch (e) {
    console.log(e);
  }
};
