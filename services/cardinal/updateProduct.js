const dayjs = require("dayjs");
const fs = require("fs");
const axios = require("axios");
const { scheduleJob } = require("node-schedule");
const { cardinal } = require("../../api/puppet");
const { CardinalProduct } = require("../../schemas/cardinal");
const { Package, Alternative } = require("../../schemas/inventory");
const voidProduct = require("./voidProduct");
const analyzeProduct = require("./analyzeProduct");
const createPackage = require("../inventory/package/createPackage");
const updatePackage = require("../inventory/package/updatePackage");

const defaultImgUrl =
  "https://cardinalhealth.bynder.com/transform/pharma-medium/6f60cc86-566e-48e2-8ab4-5f78c4b53f74/";

/**
 * Request the Puppeteer server to update(create) a Cardinal Product document.
 * @param {Package} package
 * @param {object} _option
 * @param {function} callback
 * @returns {Promise<CardinalProduct|Error>}
 */
module.exports = async function updateProduct(package, _option = {}, callback) {
  const option = Object.assign({ updateAlternative: true }, _option);
  const { updateAlternative, body } = option;
  const { _id, ndc11, alternative, cardinalProduct } = package;
  let _body = body || { query: ndc11 };
  let count = 0;
  const maxCount = 99;
  /**
   * Inner function that requests Puppeteer server to update Cardinal product.
   * @returns {Promise<CardinalProduct|undefined>}
   */
  async function update() {
    const result = await cardinal.getProductDetails(_body);
    if (result instanceof Error) {
      switch (result.status) {
        case 404:
          await voidProduct(package);
          if (updateAlternative) {
            //
          }
          break;
        case 500:
          if (count < maxCount) {
            count++;
            scheduleJob(dayjs().add(5, "minute").toDate(), update); // settings
          }
          break;
        case 503:
          scheduleJob(dayjs().add(3, "minute").toDate(), update); // settings
          break;
        default:
      }
      return result;
    } else {
      const now = dayjs();
      const results = result.data.results;
      results.lastUpdated = now;
      results.active = results.stockStatus !== "INELIGIBLE";
      const source = analyzeProduct(results);
      const product = await CardinalProduct.findOneAndUpdate(
        { cin: results.cin },
        { $set: results },
        { new: true, upsert: true }
      );
      if (!cardinalProduct) {
        await Package.findOneAndUpdate(
          { _id },
          { $addToSet: { cardinalProduct: product._id } }
        );
      }
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
      if (updateAlternative && source) {
        const { ndc, cin } = source;
        const altProduct = await CardinalProduct.findOne({ cin });
        if (!altProduct || dayjs(altProduct.lastUpdated).isBefore(now, "day")) {
          let package = await Package.findOne({ ndc11: ndc });
          if (!package) {
            package = await createPackage(ndc, "ndc11");
            updatePackage(package);
          }
          updateProdcut(package, { body: { cin } });
        }
      } else if (!source && product.contract && alternative) {
        await Alternative.findOneAndUpdate(
          { _id: alternative },
          { $set: { cardinalSource: product._id } }
        );
      }
      return product;
    }
  }
  try {
    return await update();
  } catch (e) {
    console.log(e);
    return e;
  }
};
