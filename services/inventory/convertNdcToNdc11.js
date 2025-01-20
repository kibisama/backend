/**
 * Convert a 10-digit ndc with hyphens to a 11-digit ndc with hyphens
 * @param {string} ndc
 * @returns {string}
 */
module.exports = (ndc) => {
  if (ndc.length > 0) {
    if (ndc[4] === "-") {
      return "0" + ndc;
    } else if (ndc[10] === "-") {
      return ndc.slice(0, 11).concat("0", ndc[11]);
    } else if (ndc[9] === "-") {
      return ndc.slice(0, 6).concat("0", ndc.slice(6, 12));
    }
  }
};
