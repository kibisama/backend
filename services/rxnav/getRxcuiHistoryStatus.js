const rxnav = require("../../api/rxnav");

/**
 * @typedef {object} RxcuiStatusHistory
 * @property {MetaData} metaData
 * @property {Attributes} attributes
 * @property {DefinitionalFeatures} definitionalFeatures
 * @property {DerivedConcepts} derivedConcepts
 * @typedef {object} MetaData
 * @property {rxnav.ConceptStatus} status
 * @typedef {object} Attributes
 * @property {string} rxcui
 * @property {string} name
 * @property {rxnav.TermType} tty
 * @property {"YES"|"NO"} isMultipleIngredient
 * @property {"YES"|"NO"} isBranded
 * @typedef {object} DefinitionalFeatures
 * @property {QuantityFactor} quantityFactor
 * @property {string} qualitativeDistinction
 * @typedef {object} QuantityFactor
 * @property {string} quantityFactorValue
 * @property {string} quantityFactorUnit
 * @typedef {object} DerivedConcepts
 * @property {[QuantifiedConcept]} [quantifiedConcept]
 * @property {[RemappedConcept]} [remappedConcept]
 * @property {ScdConcept} [scdConcept]
 * @property {QdFreeConcept} [qdFreeConcept]
 * @typedef {object} QuantifiedConcept
 * @property {string} quantifiedRxcui
 * @property {string} quantifiedName
 * @property {rxnav.TermType} quantifiedTTY
 * @property {"YES"|"NO"} quantifiedActive
 * @typedef {object} RemappedConcept
 * @property {string} remappedRxCui
 * @property {string} remappedName
 * @property {rxnav.TermType} remappedTTY
 * @property {"YES"|"NO"} remappedActive
 * @typedef {object} ScdConcept
 * @property {string} scdConceptRxcui
 * @property {string} scdConceptName
 * @typedef {object} QdFreeConcept
 * @property {string} qdFreeRxcui
 * @property {string} qdFreeName
 * @typedef {object} Output
 * @property {rxnav.ConceptStatus} status
 * @property {Attributes} attributes
 * @property {DefinitionalFeatures} definitionalFeatures
 * @property {[QuantifiedConcept]} [quantifiedConcept]
 * @property {[RemappedConcept]} [remappedConcept]
 * @property {ScdConcept} [scdConcept]
 * @property {QdFreeConcept} [qdFreeConcept]
 */

/**
 * @param {string} rxcui
 * @returns {Promise<Output|undefined>}
 */
module.exports = async (rxcui) => {
  try {
    const result = await rxnav("getRxcuiHistoryStatus", rxcui);
    if (result instanceof Error) {
      return;
    }
    /** @type {RxcuiStatusHistory} */
    const rxcuiStatusHistory = result.data.rxcuiStatusHistory;
    const { metaData, attributes, definitionalFeatures, derivedConcepts } =
      rxcuiStatusHistory;
    const status = metaData.status;
    if (status === "Unknown") {
      return;
    }
    /** @type {Output} */
    const output = { status, attributes, definitionalFeatures };
    const { quantifiedConcept, remappedConcept, scdConcept, qdFreeConcept } =
      derivedConcepts;
    if (quantifiedConcept) {
      output.quantifiedConcept = quantifiedConcept;
    }
    if (remappedConcept) {
      output.remappedConcept = remappedConcept;
    }
    if (scdConcept) {
      output.scdConcept = scdConcept;
    }
    if (qdFreeConcept) {
      output.qdFreeConcept = qdFreeConcept;
    }
    return output;
  } catch (e) {
    console.error(e);
  }
};
