const { scheduleJob } = require("node-schedule");
const dayjs = require("dayjs");
const PSSearch = require("../../schemas/pharmsaver/search");
const puppet = require("../../api/puppet");
const createVoidSearch = require("./createVoidSearch");
const analyzeSearchResults = require("./analyzeSearchResults");

/**
 * Request the Puppeteer server to update PharmSaver Search results.
 * It will schedule a retry depending on the response.
 * @param {string} _ndc11
 * @returns {Promise<PSSearch|Error>}
 */
module.exports = async (_ndc11) => {
  const ndc11 = _ndc11.replaceAll("-", "");
  let count = 0;
  const maxCount = 9;
  /**
   * Inner function that requests Puppeteer server to update PSSearch.
   * @returns {Promise<PSSearch|undefined>}
   */
  async function update() {
    const now = dayjs();
    console.log(
      `Requesting Puppeteer server to update Pharmsaver Search Results ${
        ndc11 + " " + now.format("MM/DD/YY HH:mm:ss")
      }...`
    );
    let _result;
    let result = await puppet.ps.getSearchResults(ndc11);
    /* If Puppeteer server fails to scrap search results */
    if (result instanceof Error) {
      switch (result.status) {
        case 404:
          await createVoidSearch(ndc11);
          break;
        case 500:
          if (count < maxCount) {
            count++;
            scheduleJob(now.add(15, "minute").toDate(), update);
          }
          break;
        case 503:
          scheduleJob(now.add(3, "minute").toDate(), update);
          break;
        default:
      }
    } else {
      const results = result.data.results;
      results.forEach((v) => {
        const suffix = ` ${v.str} ${v.form} (${v.pkg})`;
        /* Pharmsaver item descriptions can be different from each client */
        if (!v.description.endsWith(suffix)) {
          v.description += suffix;
        }
      });
      const query = { lastUpdated: dayjs(), active: true };
      Object.assign(query, analyzeSearchResults(results, ndc11));
      _result = await PSSearch.findOneAndUpdate(
        { query: ndc11 },
        { $set: query },
        { new: true, upsert: true }
      );
    }
    return _result ?? result;
  }
  try {
    return await update();
  } catch (e) {
    console.log(e);
    return e;
  }
};
