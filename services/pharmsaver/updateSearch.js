const { scheduleJob } = require("node-schedule");
const dayjs = require("dayjs");
const PSSearch = require("../../schemas/pharmsaver/psSearch");
const puppet = require("../../api/puppet");
const createVoidSearch = require("./createVoidSearch");
const updateDailyOrder = require("../inventory/updateDailyOrder");

module.exports = async function updateItem(ndc11, dailyOrder) {
  let count = 0;
  const maxCount = 4;
  async function update() {
    try {
      const now = dayjs();
      console.log(
        `Updating PharmSaver Search ${
          ndc11 + " " + now.format("MM/DD/YY HH:mm:ss")
        }...`
      );
      const result = await puppet.ps.updateSearch(ndc11);
      if (result instanceof Error) {
        switch (result.status) {
          case 404:
            return await createVoidSearch(ndc11);
          case 500:
            if (count > maxCount) {
              return await createVoidSearch(ndc11);
            }
            count++;
            scheduleJob(now.add(30, "minute").toDate(), update);
            break;
          case 503:
            // need schedule limitation according to the closing time of the store
            scheduleJob(now.add(3, "minute").toDate(), update);
            break;
          default:
        }
      } else {
        const results = result.data.results;
        results.lastUpdated = dayjs();
        const ndcSet = new Set(results.ndc);
        const ndc = [...ndcSet];
        const _ndc11 = ndc11.replaceAll("-", "");
        if (!ndc.includes(_ndc11)) {
          await createVoidSearch(ndc11);
          return await PSSearch.create({ ...results });
        }
        const _results = await PSSearch.find({
          ndc: { $in: ndc },
        });
        if (_results.length > 1) {
          for (const _result of _results) {
            const id = _result._id;
            await PSSearch.findByIdAndDelete(id);
          }
        }
        return await PSSearch.findOneAndUpdate(
          { ndc: _ndc11 },
          { ...results },
          { new: true, upsert: true }
        );
      }
      return result;
    } catch (e) {
      return e;
    }
  }
  try {
    const result = await update();
    if (dailyOrder && result && !result instanceof Error) {
      await updateDailyOrder(dailyOrder, ndc11);
    }
    return result;
  } catch (e) {
    return e;
  }
};
