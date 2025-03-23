const rxnav = require("../../api/rxnav");

/**
 * @typedef {object} RxcuiStatusHistory
 * @property {MetaData} metaData
 * @property {Attributes} attributes
 * @property {DerivedConcepts} derivedConcepts
 * @typedef {object} MetaData
 * @property {rxnav.ConceptStatus} status
 * @typedef {object} Attributes
 * @property {string} rxcui
 * @property {rxnav.TermType} tty
 * @typedef {object} DerivedConcepts
 * @property {[QuantifiedConcept]} [quantifiedConcept]
 * @property {[RemappedConcept]} [remappedConcept]
 * @property {QdFreeConcept} [qdFreeConcept]
 * @typedef {object} QuantifiedConcept
 * @property {string} quantifiedRxcui
 * @property {rxnav.TermType} quantifiedTTY
 * @property {"YES"|"NO"} quantifiedActive
 * @typedef {object} RemappedConcept
 * @property {string} remappedRxCui
 * @property {rxnav.TermType} remappedTTY
 * @property {"YES"|"NO"} remappedActive
 * @typedef {object} QdFreeConcept
 * @property {string} qdFreeRxcui
 */

/**
 * @param {string} rxcui
 * @returns {Promise<|undefined>}
 */
module.exports = async (rxcui) => {
  try {
  } catch (e) {
    console.log(e);
  }
};
