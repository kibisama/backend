const dayjs = require("dayjs");
const fs = require("fs");
const axios = require("axios");
const { scheduleJob } = require("node-schedule");
const CardinalProduct = require("../../schemas/cardinal/product");
const Package = require("../../schemas/inventory/package");
const Alternative = require("../../schemas/inventory/alternative");
const puppet = require("../../api/puppet");
const createVoidProduct = require("./createVoidProduct");
const analyzeProduct = require("./analyzeProduct");

const defaultImgUrl =
  "https://cardinalhealth.bynder.com/transform/pharma-medium/6f60cc86-566e-48e2-8ab4-5f78c4b53f74/";

/**
 * Request the Puppeteer server to update Cardinal product details.
 * It will schedule a retry depending on the response.
 * @param {object} body either cin or query
 * @param {boolean} updateAlt
 * @returns {Promise<CardinalProduct|Error>}
 */
module.exports = async function updateProduct(body, updateAlt = true) {
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
            /* for now, query must be 11-digit numbers with hyphens */
            const product = await CardinalProduct.findOne({ ndc: query });
            if (!product) {
              _result = await createVoidProduct(query);
            }
          } else {
            const product = await CardinalProduct.findOne({ cin });
            if (product) {
              await CardinalProduct.findOneAndUpdate(
                { cin },
                { active: false }
              );
            }
          }
          if (updateAlt) {
            // get all related ndcs and update alternative.cardinalProduct
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
      const now = dayjs();
      const results = result.data.results;
      results.lastUpdated = now;
      results.active = true;
      const altCin = analyzeProduct(results);
      _result = await CardinalProduct.findOneAndUpdate(
        { cin: results.cin },
        { $set: results },
        { new: true, upsert: true }
      );
      const package = await Package.findOneAndUpdate(
        { ndc11: results.ndc },
        { $addToSet: { cardinalProduct: _result._id } }
      );

      const path = `img/pharma-medium/${results.cin}.jpg`;
      fs.access(path, fs.constants.F_OK, async (err) => {
        if (err) {
          if (results.img && results.img !== defaultImgUrl) {
            const imgResult = await axios.get(results.img, {
              responseType: "arraybuffer",
            });
            fs.writeFileSync(path, imgResult.data);
          }
        }
      });
      if (updateAlt && altCin) {
        const altCaridnalProduct = await CardinalProduct.findOne(altCin);
        if (
          !altCaridnalProduct ||
          dayjs(altCaridnalProduct.lastUpdated).isBefore(now, "day")
        ) {
          updateProduct(altCin);
        }
      } else if (results.rx === "Yes") {
        const { alternative } = package;
        if (alternative) {
          await Alternative.findOneAndUpdate(
            { _id: alternative },
            { $set: { cardinalProduct: _result._id } }
          );
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
