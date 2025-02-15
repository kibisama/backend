const { getNDCProperties } = require("../../api/rxnav");
const {
  gtinToNDC,
  ndc11ToNDC,
  ndcToNDC11,
  packagingDescriptionToSizesAndUnits,
} = require("../convert");

/**
 * Gets NDC properties via getNdcProperties Api.
 * @param {string} arg
 * @param {string} type
 * @returns {Promise<object|Error>}
 */
module.exports = async (arg, type) => {
  try {
    let candidates;
    switch (type) {
      case "ndc":
        candidates = [arg];
        break;
      case "gtin":
        candidates = gtinToNDC(arg);
        break;
      case "ndc11":
        candidates = ndc11ToNDC(arg);
      default:
    }
    const results = [];
    for (let i = 0; i < candidates.length; i++) {
      const result = await getNDCProperties(candidates[i]);
      if (result instanceof Error) {
        continue;
      } else {
        const ndcPropertyList = result.data.ndcPropertyList;
        if (ndcPropertyList) {
          const index = results.length;
          results[index] = [];
          const ndcProperty = ndcPropertyList.ndcProperty;
          for (let j = 0; j < ndcProperty.length; j++) {
            results[index].push(ndcProperty[j]);
          }
          break;
        }
      }
    }
    const length = results.length;
    if (length === 0) {
      return new Error("Not found");
    }
    if (length > 1) {
      return new Error("Multiple results found");
    }

    const _result = results[0];
    const { ndc10, rxcui, packagingList, propertyConceptList } =
      _result[_result.length - 1];
    const result = { ndc: ndc10, ndc11: ndcToNDC11(ndc10), rxcui };
    const packaging = packagingList?.packaging;
    if (packaging && packaging.length > 0) {
      let description;
      const regEx = new RegExp(String.raw`[^\/]+\(${ndc10}\).*`);
      for (let i = 0; i < packaging.length; i++) {
        const match = packaging[i].match(regEx);
        if (match) {
          description = match[0].trim();
          break;
        }
      }
      if (description) {
        Object.assign(result, packagingDescriptionToSizesAndUnits(description));
      }
    }
    const propertyConcept = propertyConceptList?.propertyConcept;
    if (propertyConcept && propertyConcept.length > 0) {
      propertyConcept.forEach((v) => {
        switch (v.propName) {
          case "DCSA":
            result.dea_schedule = v.propValue;
            break;
          case "LABELER":
            result.manufacturer_name = v.propValue;
            break;
          case "LABEL_TYPE":
            result.product_type = v.propValue;
            break;
          case "SHAPETEXT":
            result.shape_text = v.propValue;
            break;
          case "SIZE":
            result.shape_size = v.propValue;
            break;
          case "COLORTEXT":
            result.color_text = v.propValue;
            break;
          case "IMPRINT_CODE":
            result.imprint_code = v.propValue;
          default:
        }
      });
    }
    return result;
  } catch (e) {
    console.log(e);
    return e;
  }
};
