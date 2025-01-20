const fs = require("fs");
const dayjs = require("dayjs");
const axios = require("axios");
const { scheduleJob } = require("node-schedule");
const CardinalProduct = require("../../schemas/cardinal/product");
const puppet = require("../../api/puppet");
const createVoidProduct = require("./createVoidProduct");
const analyzeProduct = require("./analyzeProduct");

/**
 * Request the Puppeteer server to update Cardinal product details.
 * It will schedule a retry depending on the response.
 * @param {object} body either cin or query
 * @returns {Promise<CardinalProduct|Error>}
 */
module.exports = async (body) => {
  const { cin, query } = body;
  let count = 0;
  const maxCount = 9;
  /**
   * Inner function that requests Puppeteer server to update Cardinal product.
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
      results.lastUpdated = new Date();
      results.active = true;
      const defaultImgUrl =
        "https://cardinalhealth.bynder.com/transform/pharma-medium/6f60cc86-566e-48e2-8ab4-5f78c4b53f74/";
      if (results.img && results.img !== defaultImgUrl) {
        const imgResult = await axios.get(results.img, {
          responseType: "arraybuffer",
        });
        fs.writeFileSync(
          `img/pharma-medium/${results.cin}.jpg`,
          imgResult.data
        );
      }
      analyzeProduct(results);
      _result = await CardinalProduct.findOneAndUpdate(
        { cin: results.cin },
        { $set: results },
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
