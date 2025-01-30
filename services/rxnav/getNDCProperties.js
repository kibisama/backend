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
        return result;
      } else {
        const ndcPropertyList = result.data.ndcPropertyList;
        if (ndcPropertyList) {
          const ndcProperty = ndcPropertyList.ndcProperty;
          for (let j = 0; j < ndcProperty.length; j++) {
            if (ndcProperty[j].ndc10 === candidates[i]) {
              results.push(ndcProperty[j]);
              break;
            }
          }
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
    const { ndc10, rxcui, packagingList, propertyConceptList } = results[0];
    const result = { ndc: ndc10, ndc11: ndcToNDC11(ndc10), rxcui };
    let description, dea_schedule, manufacturer_name, product_type;
    const packaging = packagingList?.packaging;
    if (packaging && packaging.length > 0) {
      const regEx = new RegExp(String.raw`[^\/]+\(${ndc10}\).*`);
      for (let i = 0; i < packaging.length; i++) {
        const match = packaging[i].match(regEx);
        if (match) {
          description = match[0].trim();
          break;
        }
      }
    }
    if (description) {
      Object.assign(result, packagingDescriptionToSizesAndUnits(description));
    }
    const propertyConcept = propertyConceptList?.propertyConcept;
    if (propertyConcept && propertyConcept.length > 0) {
      propertyConcept.forEach((v) => {
        switch (v.propName) {
          case "DCSA":
            dea_schedule = v.propValue;
            break;
          case "LABELER":
            manufacturer_name = v.propValue;
            break;
          case "LABEL_TYPE":
            product_type = v.propValue;
            break;
          default:
        }
      });
      result.dea_schedule = dea_schedule;
      result.manufacturer_name = manufacturer_name;
      result.product_type = product_type;
    }
    return result;
  } catch (e) {
    console.log(e);
    return e;
  }
};
