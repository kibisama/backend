const Package = require("../../schemas/inventory/package");
const NdcDir = require("../../schemas/openFDA/ndcDir");
const ProductLabeling = require("../../schemas/openFDA/productLabeling");
const convertNdcToNdc11 = require("../functions/convertNdcToNdc11");
const convertDescriptionToSizeAndUnit = require("../functions/convertDescriptionToSizeAndUnit");

/**
 * Creates a Package document based on NDC Directory.
 * @param {NdcDir} ndcDir
 * @param {Item} item
 * @param {RegExp} _regEx optional
 * @returns {Promise<Package|undefined>}
 */
module.exports = async (ndcDir, item, _regEx) => {
  try {
    const { gtin, _id } = item;
    const regEx =
      _regEx ??
      new RegExp(
        String.raw`${gtin.slice(3, 7)}-?${gtin[7]}-?${gtin.slice(8, 11)}-?${
          gtin[11]
        }-?${gtin[12]}`
      );
    const query = { gtin, children: [_id] };
    /* If ndcDir is false, it will refer another product with the same original packager ndc to create a minimal document. */
    if (!ndcDir) {
      const source = regEx.source;
      const _ndc = source.replace(/[^0-9]+/g, "");
      const regex = source.substring(0, 12) + `(${source[14]}|$)`;
      const reference = await ProductLabeling.findOne({
        "openfda.original_packager_product_ndc": { $regex: regex },
      });
      if (!reference) {
        return;
      }
      const {
        brand_name,
        generic_name,
        original_packager_product_ndc,
        product_ndc,
      } = reference.openfda;
      ndcDir = await NdcDir.findOne({
        product_ndc: product_ndc[0],
      });
      let ndc = "";
      if (original_packager_product_ndc[0].length === 9) {
        ndc = original_packager_product_ndc[0] + "-" + _ndc.substring(8, 10);
      } else if (original_packager_product_ndc[0].length === 10) {
        ndc = original_packager_product_ndc[0] + "-" + _ndc[9];
      }
      const ndc11 = convertNdcToNdc11(ndc);
      const name = `${ndc11}${
        generic_name
          ? " | " + generic_name[0]
          : brand_name
          ? " | " + brand_name[0]
          : ""
      }`;
      Object.assign(query, {
        name,
        ndc,
        ndc11,
        brand_name: brand_name ? brand_name[0] : undefined,
        generic_name: generic_name ? generic_name[0] : undefined,
      });
    } else {
      const {
        packaging,
        brand_name,
        generic_name,
        labeler_name,
        product_type,
        dosage_form,
        route,
      } = ndcDir;
      const { rxcui, manufacturer_name } = ndcDir.openfda;
      let ndc,
        description = "";
      for (let i = 0; i < packaging.length; i++) {
        /* Trim if descriptions are divided by the character * */
        const target = packaging[i].description;
        const _regEx = new RegExp(String.raw`[^*]+\(${regEx.source}\)?[^*]+`);
        const match = target.match(_regEx);
        if (!match) {
          continue;
        }
        const target2 = packaging[i].package_ndc;
        const match2 = target2.match(regEx);
        if (match && match2) {
          description = match[0].trim();
          ndc = target2;
          break;
        } else if (match) {
          const newRegEx = new RegExp(String.raw`[^\/]+\(${regEx.source}\).*`);
          const newMatch = target.match(newRegEx);
          if (newMatch) {
            description = newMatch[0].trim();
          }
          ndc = target.match(regEx)[0];
          break;
        }
      }
      const ndc11 = convertNdcToNdc11(ndc);
      const [_sizes, _units] = convertDescriptionToSizeAndUnit(description);
      let size, unit;
      let units,
        sizes = [];
      if (_sizes && _units) {
        unit = _units[_units.length - 2];
        units = [...new Set(_units)];
        units.forEach((v) => {
          const index = _units.indexOf(v);
          if (index % 2) {
            let _size = _sizes[1];
            if (index > 1) {
              for (let i = 3; i < index + 1; i = i + 2) {
                _size *= _sizes[i];
              }
            }
            sizes.push(_size.toString());
          } else {
            let _size = 1;
            for (let i = 0; i < index + 2; i++) {
              if (i % 2) {
                _size /= _sizes[i];
              } else {
                _size *= _sizes[i];
              }
            }
            sizes.push(_size.toString());
          }
        });
        size = sizes[units.indexOf(unit)];
      }
      let _manufacturer_name =
        manufacturer_name && manufacturer_name.length > 0
          ? manufacturer_name[0]
          : labeler_name;
      let mfrName;
      const match = _manufacturer_name.match(/([^\s,]+)/);
      if (match && match[0].length > 3) {
        mfrName = match[0];
      }
      let desc = "";
      if (size && unit) {
        desc += size.toString() + " " + unit;
      }
      let brandName = "";
      if (brand_name && generic_name) {
        if (brand_name.toUpperCase() !== generic_name.toUpperCase()) {
          brandName = brand_name;
        }
      }
      const name = `${ndc11} | ${mfrName ?? _manufacturer_name}${
        brandName ? " | " + brandName : ""
      }${desc ? " | " + desc : ""}`;
      Object.assign(query, {
        name,
        ndc,
        ndc11,
        brand_name,
        generic_name,
        rxcui,
        manufacturer_name: _manufacturer_name,
        product_type,
        dosage_form,
        route: route ? route.join(", ") : undefined,
        size,
        sizes,
        unit,
        units,
        ndcDir: ndcDir._id,
      });
    }
    /* If any ndcDir has active_ingredients property, update active_ingredients & strength info */
    if (ndcDir) {
      const { active_ingredients } = ndcDir;
      if (active_ingredients instanceof Array) {
        const names = active_ingredients.map((v) => v.name);
        query.active_ingredients = names.join(", ");
        const strengths = active_ingredients.map((v, i, a) => {
          let text = v.strength;
          const match = v.strength.match(/([^\d.]+)(.+)/);
          const match2 = a[i + 1]?.strength.match(/([^\d.]+)(.+)/);
          if (match && match2 && match[0] === match2[0]) {
            text = text.substring(0, text.length - match[0].length);
          }
          if (text.startsWith(".")) {
            text = "0" + text;
          }
          if (text.endsWith("/1")) {
            text = text.substring(0, text.length - 2);
          }
          return text;
        });
        query.strength = strengths.join("-");
      }
    }
    return await Package.create(query);
  } catch (e) {
    console.log(e);
  }
};
