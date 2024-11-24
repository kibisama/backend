const { scheduleJob } = require("node-schedule");
const dayjs = require("dayjs");
const PSSearch = require("../../schemas/pharmsaver/psSearch");
const puppet = require("../../api/puppet");
const createVoidSearch = require("./createVoidSearch");
const updateDailyOrder = require("../inventory/updateDailyOrder");

/**
 * Request the Puppeteer server to update PharmSaver Search results. It will schedule a retry depending on the Puppeteer server status.
 * @param {string} ndc11
 * @param {DailyOrder} dailyOrder optional
 * @returns {Promise<PSSearch|Error>}
 */
module.exports = async function updateItem(ndc11, dailyOrder) {
  let count = 0;
  const maxCount = 4;
  /**
   * Inner function that requests Puppeteer server to update PSSearch.
   * @returns {Promise<PSSearch|Error>}
   */
  async function update() {
    try {
      const now = dayjs();
      console.log(
        `Requesting Puppeteer server to update PSSearch ${
          ndc11 + " " + now.format("MM/DD/YY HH:mm:ss")
        }...`
      );
      let result = await puppet.ps.updateSearch(ndc11);
      /* If Puppeteer server fails to scrap search results */
      if (result instanceof Error) {
        switch (result.status) {
          case 404:
            await createVoidSearch(ndc11);
            if (dailyOrder) {
              await updateDailyOrder(dailyOrder, ndc11);
            }
          case 500:
            if (count > maxCount) {
              await createVoidSearch(ndc11);
              if (dailyOrder) {
                await updateDailyOrder(dailyOrder, ndc11);
              }
            }
            count++;
            scheduleJob(now.add(30, "minute").toDate(), update);
            break;
          case 503:
            scheduleJob(now.add(3, "minute").toDate(), update);
            break;
          default:
        }
        return result;
      } else {
        const results = result.data.results;
        let _result;
        const _ndc11 = ndc11.replaceAll("-", "");
        results.lastUpdated = dayjs();
        const querySet = new Set(results.ndc.concat(_ndc11)); // Pharmsaver search can result in the results without the querying ndc
        const _query = [...querySet];
        const _results = await PSSearch.find({
          query: { $in: _query },
        });
        /* If previous PSSearch document(s) exist, merge their query field & keep only one document */
        if (_results.length > 0) {
          for (let i = 0; i < _results.length; i++) {
            _results[i].query.forEach((v) => {
              querySet.add(v);
            });
          }
          results.query = [...querySet];
          const _id = _results[0]._id;
          if (_results.length > 1) {
            for (let i = _results.length - 1; i > 0; i--) {
              await PSSearch.findByIdAndDelete(results[i]._id);
            }
          }
          _result = await PSSearch.findOneAndUpdate(
            {
              _id,
            },
            results,
            {
              new: true,
              upsert: true,
            }
          );
        } else {
          results.query = _query;
          _result = await PSSearch.create(results);
        }
        if (dailyOrder && _result) {
          await updateDailyOrder(dailyOrder, ndc11);
        }
        return _result;
      }
    } catch (e) {
      return e;
    }
  }
  try {
    const result = await update();
    return result;
  } catch (e) {
    return e;
  }
};
