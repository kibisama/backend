const { scheduleJob } = require("node-schedule");
const dayjs = require("dayjs");
const PSSearch = require("../../schemas/pharmsaver/psSearch");
const puppet = require("../../api/puppet");
const createVoidSearch = require("./createVoidSearch");
const updateDailyOrder = require("../inventory/updateDailyOrder");

/**
 * Request the Puppeteer server to update PharmSaver Search results.
 * It will schedule a retry depending on the response.
 * @param {string} _ndc11 11-digit numbers with hyphens
 * @param {DailyOrder} dailyOrder optional
 * @returns {Promise<PSSearch|Error>}
 */
module.exports = async (_ndc11, dailyOrder) => {
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
          _result = await createVoidSearch(ndc11);
          break;
        case 500:
          if (count < maxCount) {
            count++;
            scheduleJob(now.add(30, "minute").toDate(), update);
          }
          break;
        case 503:
          scheduleJob(now.add(3, "minute").toDate(), update);
          break;
        default:
      }
    } else {
      const results = result.data.results;
      const queryTable = { [ndc11]: true };
      results.forEach((v) => {
        queryTable[v.ndc] = true;
      });
      const query = [...Object.keys(queryTable)];
      const data = { lastUpdated: dayjs(), query, results };
      const _results = await PSSearch.find({
        query: { $in: query },
      });
      /* If previous PSSearch document(s) exist, merge their query field & keep only one document */
      if (_results.length > 0) {
        for (let i = 0; i < _results.length; i++) {
          _results[i].query.forEach((v) => {
            if (!queryTable[v]) {
              queryTable[v] = true;
              query.push(v);
            }
          });
          if (i > 0) {
            await PSSearch.findByIdAndDelete(results[i]._id);
          }
        }
        const _id = _results[0]._id;
        _result = await PSSearch.findOneAndUpdate(
          {
            _id,
          },
          data,
          {
            new: true,
            upsert: true,
          }
        );
      } else {
        _result = await PSSearch.create(data);
      }
    }
    if (dailyOrder && _result) {
      await updateDailyOrder(dailyOrder, _ndc11);
    }
    return _result ?? result;
  }
  try {
    return await update();
  } catch (e) {
    return e;
  }
};
