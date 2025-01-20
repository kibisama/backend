const { getNdcProperties } = require("../../api/rxnav");
const convertPackagingDescriptionToSizeAndUnit = require("../inventory/convertPackagingDescriptionToSizeAndUnit");
const convertNdcToNdc11 = require("../inventory/convertNdcToNdc11");

/**
 * Finds NDC properties by GTIN via getNdcProperties Api.
 * @param {string} gtin
 * @returns {Promise<object|Error>}
 */
module.exports = async (gtin) => {
  try {
    const frag = [
      gtin.slice(3, 7),
      gtin[7],
      gtin.slice(8, 11),
      gtin[11],
      gtin[12],
    ];
    const candidates = [
      `${frag[0]}-${frag[1] + frag[2]}-${frag[3] + frag[4]}`,
      `${frag[0] + frag[1]}-${frag[2] + frag[3]}-${frag[4]}`,
      `${frag[0] + frag[1]}-${frag[2]}-${frag[3] + frag[4]}`,
    ];
    const results = [];
    for (let i = 0; i < 3; i++) {
      const result = await getNdcProperties(candidates[i]);
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
    const result = { ndc: ndc10, ndc11: convertNdcToNdc11(ndc10), rxcui };
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
      Object.assign(
        result,
        convertPackagingDescriptionToSizeAndUnit(description)
      );
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
