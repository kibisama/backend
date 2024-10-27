/**
 * @param {string} ndc
 * @returns {string}
 */
module.exports = (ndc) => {
  if (ndc[4] === "-") {
    return "0" + ndc;
  } else if (ndc[10] === "-") {
    return ndc.slice(0, 11).concat("0", ndc[11]);
  } else {
    return ndc.slice(0, 6).concat("0", ndc.slice(6, 12));
  }
};
