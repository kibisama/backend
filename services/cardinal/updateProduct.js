// const fs = require("fs");
// const axios = require("axios");
const { scheduleJob } = require("node-schedule");
const dayjs = require("dayjs");
const CardinalProduct = require("../../schemas/cardinal/cardinalProduct");
const puppet = require("../../api/puppet");
const updateDailyOrder = require("../inventory/updateDailyOrder");
const createVoidProduct = require("./createVoidProduct");

/**
 * Request the Puppeteer server to update Cardinal product details.
 * It will schedule a retry depending on the response.
 * @param {object} body either cin or query
 * @param {DailyOrder} dailyOrder optional
 * @returns {Promise<CardinalProduct|Error>}
 */
module.exports = async (body, dailyOrder) => {
  const { cin, query } = body;
  let count = 0;
  const maxCount = 9;
  /**
   * Inner function that requests Puppeteer server to update PSSearch.
   * @returns {Promise<CardinalProduct|undefined>}
   */
  async function update() {
    const now = dayjs();
    console.log(
      `Requesting Puppeteer server to update Cardinal Product Details ${
        cin ?? query + " " + now.format("MM/DD/YY HH:mm:ss")
      }...`
    );
    let _result;
    let result = await puppet.cardinal.getProductDetails(body);
    if (result instanceof Error) {
      switch (result.status) {
        case 404:
          if (!cin) {
            /* query must be 11-digit numbers with hyphens */
            _result = await createVoidProduct(query);
          }
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
      results.lastUpdated = dayjs();
      // if () {
      //   const imgResult = await axios.get(results.img, {
      //     responseType: "arraybuffer",
      //   });
      //   fs.writeFileSync(`img/${cin}.jpg`, imgResult.data);
      // }
      _result = await CardinalProduct.findOneAndUpdate(
        { cin: results.cin },
        results,
        {
          new: true,
          upsert: true,
        }
      );
    }
    if (dailyOrder && _result) {
      await updateDailyOrder(dailyOrder, _result.ndc);
    }
    return _result ?? result;
  }
  try {
    return await update();
  } catch (e) {
    return e;
  }
};
