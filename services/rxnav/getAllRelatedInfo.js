const rxnav = require("../../api/rxnav");

/**
 * @typedef {object} allRelatedGroup
 * @property {[ConceptGroup]} conceptGroup
 * @typedef {object} ConceptGroup
 * @property {rxnav.TermType} tty
 * @property {[ConceptProperties]} [conceptProperties]
 * @typedef {object} ConceptProperties
 * @property {string} rxcui
 * @property {string} name
 * @property {string} synonym
 * @property {rxnav.TermType} tty
 * @property {string} [psn]
 * @typedef {object} Output
 * @property {[ConceptProperties]} sbd
 * @property {[ConceptProperties]} scd
 * @property {[ConceptProperties]} sbdf
 * @property {[ConceptProperties]} scdf
 */

/** @type {{sbd: number, scd: number, sbdf: number, scdf: number}} */
let termIndex;
/** @returns {undefined} */
const getTermType = async () => {
  const termTypeList = await rxnav("getTermTypes");
  if (!(termTypeList instanceof Error)) {
    /** @type {[rxnav.TermType]} */
    const termType = termTypeList.termTypeList?.termType;
    if (termType) {
      const _termIndex = {};
      termType.forEach((v, i) => {
        switch (v) {
          case "SBD":
            _termIndex.sbd = i;
            break;
          case "SCD":
            _termIndex.scd = i;
            break;
          case "SBDF":
            _termIndex.sbdf = i;
            break;
          case "SCDF":
            _termIndex.scdf = i;
            break;
          default:
        }
      });
      if (
        _termIndex.sbd &&
        _termIndex.scd &&
        _termIndex.sbdf &&
        _termIndex.scdf
      ) {
        termIndex = _termIndex;
      }
    }
  }
};
getTermType();

/**
 * O(N)
 * @param {[ConceptGroup]} conceptGroup
 * @returns {Output}
 */
const mapOutput = (conceptGroup) => {
  /** @type {Output} */
  const output = {};
  conceptGroup.forEach((v) => {
    switch (v.tty) {
      case "SBD":
        output.sbd = v;
        break;
      case "SCD":
        output.scd = v;
        break;
      case "SBDF":
        output.sbdf = v;
        break;
      case "SCDF":
        output.scdf = v;
        break;
      default:
    }
  });
  return output;
};
/**
 * O(1)
 * @param {[ConceptGroup]} conceptGroup
 * @returns {Output|undefined}
 */
const quickMapOutput = (conceptGroup) => {
  const _sbd = conceptGroup[termIndex.sbd];
  const _scd = conceptGroup[termIndex.scd];
  const _sbdf = conceptGroup[termIndex.sbdf];
  const _scdf = conceptGroup[termIndex.scdf];
  const sbd = _sbd.conceptProperties;
  const scd = _scd.conceptProperties;
  const sbdf = _sbdf.conceptProperties;
  const scdf = _scdf.conceptProperties;
  if (
    _sbd.tty !== "SBD" ||
    _scd.tty !== "SCD" ||
    _sbdf.tty !== "SBDF" ||
    _scdf.tty !== "SCDF"
  ) {
    getTermType();
    return;
  }
  return { sbd, scd, sbdf, scdf };
};

/**
 * @param {string} rxcui
 * @returns {Promise<Output|undefined>}
 */
module.exports = async (rxcui) => {
  try {
    const result = await rxnav("getAllRelatedInfo", rxcui);
    if (result instanceof Error) {
      return;
    }
    let output;
    /** @type {[ConceptGroup]} */
    const conceptGroup = result.data.allRelatedGroup.conceptGroup;
    if (termIndex) {
      output = quickMapOutput(conceptGroup);
    }
    if (!output) {
      output = mapOutput(conceptGroup);
    }
    if (Object.keys(output).length > 0) {
      return output;
    }
  } catch (e) {
    console.log(e);
  }
};
