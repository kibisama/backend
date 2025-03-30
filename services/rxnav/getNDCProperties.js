const rxnav = require("../../api/rxnav");
const { getMaxNumberString } = require("../common");

/**
 * @typedef {object} NDCPropertyList
 * @property {[NDCProperty]} ndcProperty
 * @typedef {object} NDCProperty
 * @property {string} ndcItem
 * @property {string} ndc9
 * @property {string} ndc10
 * @property {string} rxcui
 * @property {string} splSetIdItem
 * @property {PackagingList} packagingList
 * @property {PropertyConceptList} propertyConceptList
 * @property {string} source
 * @typedef {object} PackagingList
 * @property {[string]} packaging
 * @typedef {object} PropertyConceptList
 * @property {[PropertyConcept]} propertyConcept
 * @typedef {object} PropertyConcept
 * @property {rxnav.PropertyName} propName
 * @property {string} propValue
 * @typedef {import("../inv/package").UpdateObj} Output
 */

/**
 * @param {[NDCProperty]} ndcProps
 * @param {string} rxcui
 * @return {NDCProperty}
 */
const selectNdcProp = (ndcProps, rxcui) => {
  let ndcProperty;
  if (rxcui) {
    for (let i = 0; i < ndcProps.length; i++) {
      const _ndcProperty = ndcProps[i];
      if (_ndcProperty.rxcui === rxcui) {
        ndcProperty = _ndcProperty;
      }
    }
  }
  if (!ndcProperty) {
    const numberArray = ndcProps.map((v) => Number(v.rxcui));
    ndcProperty = ndcProps[getMaxNumberString(numberArray)[1]];
  }
  return ndcProperty;
};
/**
 * @param {NDCProperty} ndcProp
 * @return {Output}
 */
const createUpdateObj = (ndcProp) => {
  /** @type {Output} */
  const output = {};
  const { propertyConceptList, packagingList } = ndcProp;
  propertyConceptList.propertyConcept.forEach((v) => {
    switch (v.propName) {
      case "LABELER":
        output.mfr = v.propValue;
        break;
      case "DCSA":
        output.schedule = v.propValue;
        break;
      case "SHAPETEXT":
        output.shape = v.propValue;
        break;
      case "SIZE":
        output.shapeSize = v.propValue;
        break;
      case "COLORTEXT":
        output.color = v.propValue;
        break;
      case "IMPRINT_CODE":
        output.imprint = v.propValue;
        break;
      default:
    }
  });
  return output;
};
/**
 * @param {string} ndc
 * @param {string} [rxcui]
 * @returns {Promise<Output|undefined>}
 */
module.exports = async (ndc, rxcui) => {
  try {
    /** @type {Output} */
    const output = {};
    const result = await rxnav("getNDCProperties", ndc);
    /** @type {NDCPropertyList|undefined} */
    const ndcPropertyList = result.data.ndcPropertyList;
    if (ndcPropertyList) {
      const ndcProperty = selectNdcProp(ndcPropertyList.ndcProperty, rxcui);
      output.rxcui = ndcProperty.rxcui;
      Object.assign(output, createUpdateObj(ndcProperty));
      return output;
    }
  } catch (e) {
    console.log(e);
  }
};
