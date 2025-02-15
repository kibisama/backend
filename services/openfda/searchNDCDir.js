const { ndc } = require("../../api/openfda");
const {
  gtinToNDC,
  ndc11ToNDC,
  ndcToNDC11,
  packagingDescriptionToSizesAndUnits,
} = require("../convert");

/**
 * Updates a NDC Directory document.
 * @param {string} arg
 * @param {string} type
 * @returns {Promise<object|Error>}
 */
module.exports = async (arg, type) => {
  try {
    let query = "";
    let regEx;
    switch (type) {
      case "gtin":
        query = gtinToNDC(arg)
          .map((v) => `"${v}"`)
          .join("+");
        regEx = new RegExp(
          String.raw`${arg.slice(3, 7)}-?${arg[7]}-?${arg.slice(8, 11)}-?${
            arg[11]
          }-?${arg[12]}`
        );
        break;
      case "ndc11":
        query = ndc11ToNDC(arg)
          .map((v) => `"${v}"`)
          .join("+");
        regEx = new RegExp(
          String.raw`${arg
            .split("-")
            .map((v) => {
              if (v.startsWith("0")) {
                return "0?" + v.substring(1);
              } else {
                return v;
              }
            })
            .join("-")}`
        );
        break;
      default:
        throw new Error("Invalid argument type");
    }
    let result = await ndc.searchOneByPackageDescription(query);
    if (result instanceof Error) {
      return result;
    }
    if (result.data.meta.results.total > 1) {
      return new Error("Multiple results found");
    }
    const ndcDir = result.data.results[0];
    const {
      generic_name,
      labeler_name,
      dea_schedule,
      brand_name,
      active_ingredients,
      packaging,
      product_type,
    } = ndcDir;
    const { manufacturer_name } = ndcDir.openfda;
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
        const _regEx = new RegExp(String.raw`[^\/]+\(${regEx.source}\).*`);
        const match = target.match(_regEx);
        if (match) {
          description = match[0].trim();
        }
        ndc = target.match(regEx)[0];
        break;
      }
    }
    const ndc11 = ndcToNDC11(ndc);
    const { unit, units, size, sizes } =
      packagingDescriptionToSizesAndUnits(description);
    let strength;
    if (active_ingredients instanceof Array) {
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
      strength = strengths.join("-");
    }
    return {
      ndc,
      ndc11,
      brand_name,
      generic_name,
      labeler_name,
      dea_schedule,
      manufacturerName: manufacturer_name ? manufacturer_name[0] : undefined,
      strength,
      size,
      sizes,
      unit,
      units,
      product_type,
    };
  } catch (e) {
    console.log(e);
    return e;
  }
};
