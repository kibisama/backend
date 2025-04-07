const rxnav = require("../../api/rxnav");

/**
 * @typedef {{sbd: number, scd: number, sbdf: number, scdf: number, bpck: number, gpck: number}} TermIndex
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
 * @property {[ConceptProperties]} [sbd]
 * @property {[ConceptProperties]} [scd]
 * @property {[ConceptProperties]} [sbdf]
 * @property {[ConceptProperties]} [scdf]
 * @property {[ConceptProperties]} [bpck]
 * @property {[ConceptProperties]} [gpck]
 */

/** @type {TermIndex} */
let termIndex;
/** @returns {undefined} */
const getTermType = async () => {
  const result = await rxnav("getTermTypes");
  if (result instanceof Error) {
    return;
  }
  /** @type {[rxnav.TermType]} */
  const termType = result.data.termTypeList?.termType;
  if (termType) {
    /** @type {TermIndex} */
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
        case "BPCK":
          _termIndex.bpck = i;
          break;
        case "GPCK":
          _termIndex.gpck = i;
          break;
        default:
      }
    });
    if (
      _termIndex.sbd &&
      _termIndex.scd &&
      _termIndex.sbdf &&
      _termIndex.scdf &&
      _termIndex.bpck &&
      _termIndex.gpck
    ) {
      termIndex = _termIndex;
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
    const { tty, conceptProperties } = v;
    switch (tty) {
      case "SBD":
        output.sbd = conceptProperties;
        break;
      case "SCD":
        output.scd = conceptProperties;
        break;
      case "SBDF":
        output.sbdf = conceptProperties;
        break;
      case "SCDF":
        output.scdf = conceptProperties;
        break;
      case "BPCK":
        output.bpck = conceptProperties;
        break;
      case "GPCK":
        output.gpck = conceptProperties;
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
  const _bpck = conceptGroup[termIndex.bpck];
  const _gpck = conceptGroup[termIndex.gpck];
  if (
    _sbd.tty !== "SBD" ||
    _scd.tty !== "SCD" ||
    _sbdf.tty !== "SBDF" ||
    _scdf.tty !== "SCDF" ||
    _bpck.tty !== "BPCK" ||
    _gpck.tty !== "GPCK"
  ) {
    return getTermType();
  }
  return {
    sbd: _sbd.conceptProperties,
    scd: _scd.conceptProperties,
    sbdf: _sbdf.conceptProperties,
    scdf: _scdf.conceptProperties,
    bpck: _bpck.conceptProperties,
    gpck: _gpck.conceptProperties,
  };
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
