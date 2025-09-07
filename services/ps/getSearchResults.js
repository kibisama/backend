const { scheduleJob } = require("node-schedule");
const { ps } = require("../../api/puppet");
const { ndcToCMSNDC11 } = require("../convert");
const { setDelay } = require("../common");

// /**
//  * @param {string} gtin
//  * @returns {string}
//  */
// const gtinToQuery = (gtin) => {
//   return gtin.slice(3, 13);
// };
/**
 * @typedef {object} Body
 * @property {string} q
 */
/**
 * @param {PsPackage} psPackage populated
 * @returns {Body|undefined}
 */
const selectQuery = (psPackage) => {
  const { ndc, ndc11, gtin } = psPackage.package;
  if (ndc11) {
    return { q: ndc11.replaceAll("-", "") };
  } else if (ndc) {
    return { q: ndcToCMSNDC11(ndc) };
  }
  //   else {
  //     return { q: gtinToQuery(gtin) };
  //   }
};
/**
 * @param {PsPackage} psPackage
 * @param {function} callback
 * @returns {Promise<void>}
 */
module.exports = async (psPackage, callback) => {
  await psPackage.populate({ path: "package" });
  const query = selectQuery(psPackage);
  if (!query) {
    return;
  }
  let count = 0;
  const maxCount = 9;
  async function request() {
    try {
      const result = await ps.getSearchResults(query);
      if (result instanceof Error) {
        switch (result.status) {
          case 400:
            break;
          case 404:
            callback(null, psPackage);
            break;
          case 500:
            if (count < maxCount) {
              count++;
              scheduleJob(setDelay(15), request);
            }
            break;
          case 503:
            scheduleJob(setDelay(3), request);
            break;
          default:
        }
      } else {
        callback(result.data, psPackage);
      }
    } catch (e) {
      console.error(e);
    }
  }
  request();
};
