const { scheduleJob } = require("node-schedule");
const { cardinal } = require("../../api/puppet");
const findRelatedNDCs = require("../rxnav/findRelatedNDCs");
const { setDelay } = require("../common");

/**
 * @typedef {object} Body
 * @property {[string]} queries
 */

/**
 * @param {string} ndc
 * @returns {Promise<Body|undefined>}
 */
const getQueries = async (ndc) => {
  try {
    const queries = await findRelatedNDCs(ndc);
    if (queries) {
      return { queries };
    }
  } catch (e) {
    console.error(e);
  }
};

/**
 * @param {string} ndc
 * @param {Function} callback
 * @returns {undefined}
 */
module.exports = async (ndc, callback) => {
  const queries = await getQueries(ndc);
  if (!queries) {
    //
    return;
  }
  let count = 0;
  const maxCount = 99;
  async function request() {
    try {
      const result = await cardinal.searchProducts(queries);
      if (result instanceof Error) {
        switch (result.status) {
          case 400:
            break;
          case 404:
            callback(null, queries.queries);
            break;
          case 500:
            if (count < maxCount) {
              count++;
              scheduleJob(setDelay(5), request);
            }
            break;
          case 503:
            scheduleJob(setDelay(3), request);
            break;
          default:
        }
      } else {
        callback(result.data, queries.queries);
      }
    } catch (e) {
      console.error(e);
    }
  }
  request();
};
