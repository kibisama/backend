const convertNdcToNdc11 = require("./convertNdcToNdc11");
const convertPackagingDescriptionToSizeAndUnit = require("./convertPackagingDescriptionToSizeAndUnit");

/**
 * Defines a Package Document fields based on NDC Directory Document.
 * @param {string} gtin
 * @param {NdcDir} ndcDir
 * @returns {Promise<object|undefined>}
 */
module.exports = (gtin, ndcDir) => {
  try {
    const {
      _id,
      generic_name,
      labeler_name,
      brand_name,
      active_ingredients,
      packaging,
      dosage_form,
    } = ndcDir;
    const { manufacturer_name } = ndcDir.openfda;
    const regEx = new RegExp(
      String.raw`${gtin.slice(3, 7)}-?${gtin[7]}-?${gtin.slice(8, 11)}-?${
        gtin[11]
      }-?${gtin[12]}`
    );
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
    const ndc11 = convertNdcToNdc11(ndc);
    const { unit, units, size, sizes } =
      convertPackagingDescriptionToSizeAndUnit(description);
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
      manufacturerName: manufacturer_name ? manufacturer_name[0] : undefined,
      dosage_form,
      strength,
      size,
      sizes,
      unit,
      units,
      ndcDir: _id,
    };
  } catch (e) {
    console.log(e);
  }
};
