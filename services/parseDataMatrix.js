/**
 * @param {string} dataMatrix
 * @returns {Object}
 */
const parseDataMatrix = (dataMatrix) => {
  const gtin = dataMatrix.match(/(?<=\(01\))\d{14}/)[0];
  const lot = dataMatrix.match(/(?<=\(10\))([a-zA-Z0-9]{1,20})(\\x1d)?/)[0];
  const exp = dataMatrix.match(/(?<=\(17\))\d{6}/)[0];
  const sn = dataMatrix.match(/(?<=\(21\))([a-zA-Z0-9]{1,20})(\\x1d)?/)[0];
  return { gtin, lot, exp, sn };
};

module.exports = parseDataMatrix;
