const { scheduleJob } = require("node-schedule");
const dayjs = require("dayjs");
const PSSearch = require("../../schemas/pharmsaver/search");
const PSItem = require("../../schemas/pharmsaver/item");
const Package = require("../../schemas/inventory/package");
const Alternative = require("../../schemas/inventory/alternative");
const puppet = require("../../api/puppet");
const createVoidItem = require("./createVoidItem");
const analyzeSearchResults = require("./analyzeSearchResults");

/**
 * Request the Puppeteer server to update PharmSaver Search results.
 * It will schedule a retry depending on the response.
 * @param {string} _ndc11 11-digit with hyphens
 * @returns {Promise<PSItem|Error>}
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
          await createVoidItem(_ndc11);
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
      const { item, search } = analyzeSearchResults(results, ndc11);
      const psItemQuery = { lastUpdated: new Date() };
      if (item) {
        psItemQuery.active = true;
        Object.assign(psItemQuery, item);
      } else {
        psItemQuery.active = false;
      }
      _result = await PSItem.findOneAndUpdate(
        { ndc: ndc11 },
        { $set: psItemQuery },
        { new: true, upsert: true }
      );
      const package = await Package.findOneAndUpdate(
        { ndc11: _ndc11 },
        { psItem: _result._id }
      );
      const _id = package.alternative;
      if (_id) {
        const alternative = await Alternative.findOne({ _id });
        if (alternative) {
          if (alternative.psSearch) {
            const query = { lastUpdated: new Date(), results: search };
            await PSSearch.findOneAndUpdate(
              { _id: alternative.psSearch },
              { $set: query }
            );
          } else {
            await Alternative.findOneAndUpdate(
              { _id },
              { psSearch: (await PSSearch.create(query))._id }
            );
          }
        }
      }
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
