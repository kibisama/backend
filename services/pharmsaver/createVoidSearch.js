const dayjs = require("dayjs");
const PSSearch = require("../../schemas/pharmsaver/psSearch");

/**
 * Creates an empty PSSearch document if no query result found.
 * @param {string} ndc11
 * @returns {Promise<PSSearch|undefined>}
 */
module.exports = async (ndc11) => {
  const ndc = ndc11.replaceAll("-", "");
  try {
    const _result = await PSSearch.findOne({ query: ndc });
    if (_result) {
      return;
    } else {
      return await PSSearch.create({
        lastUpdated: dayjs(),
        query: [ndc],
      });
    }
  } catch (e) {
    console.log(e);
  }
};
