const dayjs = require("dayjs");
const fs = require("fs");
const axios = require("axios");
const { CardinalProduct } = require("../../schemas/cardinal");
const { Package, Alternative } = require("../../schemas/inventory");
const voidProduct = require("./voidProduct");
const selectSource = require("./selectSource");
const analyzeProduct = require("./analyzeProduct");
const createPackage = require("../inventory/package/createPackage");
const updatePackage = require("../inventory/package/updatePackage");
const requestPuppet = require("./requestPuppet");
const getNDCs = require("../rxnav/getNDCs");

const defaultImgUrl =
  "https://cardinalhealth.bynder.com/transform/pharma-medium/6f60cc86-566e-48e2-8ab4-5f78c4b53f74/";

module.exports = {
  /**
   * Request the Puppeteer server to update(create) a Cardinal Product document.
   * @param {Package} package
   * @param {object} _option
   * @param {function} _callback
   * @returns {Promise<undefined>}
   */
  async updateProduct(package, _option, _callback) {
    try {
      const option = Object.assign({ updateAlternative: true }, _option ?? {});
      const { updateAlternative, body } = option;
      const { _id, ndc11, alternative, cardinalProduct } = package;
      let _body = body || { query: ndc11 };
      async function callback(data) {
        const now = dayjs();
        const { results } = data;
        results.lastUpdated = now;
        const stockStatus = results.stockStatus;
        results.active = stockStatus && stockStatus !== "INELIGIBLE";
        const source = analyzeProduct(results);
        const product = await CardinalProduct.findOneAndUpdate(
          { cin: results.cin },
          { $set: results },
          { new: true, upsert: true }
        );
        if (!cardinalProduct) {
          package = await Package.findOneAndUpdate(
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
          if (
            !altProduct ||
            dayjs(altProduct.lastUpdated).isBefore(now, "day")
          ) {
            let package = await Package.findOne({ ndc11: ndc });
            if (!package) {
              const _package = await createPackage(ndc, "ndc11");
              package = await updatePackage(_package);
            }
            module.exports.updateProduct(package, { body: { cin } }, _callback);
          }
        } else if (!source && product.contract && alternative) {
          await Alternative.findOneAndUpdate(
            { _id: alternative },
            { $set: { cardinalSource: product._id } }
          );
        }
        if (_callback instanceof Function) {
          _callback(package);
        }
        return product;
      }
      const onError = {
        404: async function () {
          await voidProduct(package);
          if (updateAlternative) {
            if (alternative) {
              module.exports.updateSource(
                await Alternative.findOne({ _id: alternative }),
                _callback
              );
            }
          }
        },
      };
      requestPuppet("getProductDetails", _body, callback, onError);
    } catch (e) {
      console.log(e);
    }
  },
  /**
   * Request the Puppeteer server to update cardinalSource.
   * @param {Alternative} alternative
   * @param {function} _callback
   * @returns {Promise<undefined>}
   */
  async updateSource(alternative, _callback) {
    try {
      const { rxcui, cardinalSource } = alternative;
      const ndcs = [];
      if (cardinalSource) {
        const product = await CardinalProduct.findOne({ _id: cardinalSource });
        const ndc = product?.ndc;
        if (ndc) {
          ndcs[0] = ndc;
        }
      } else {
        for (let i = 0; i < rxcui.length; i++) {
          const ndc = await getNDCs(rxcui[i]);
          if (!(ndc instanceof Error)) {
            ndcs.push.apply(ndcs, ndc);
          }
        }
      }
      if (ndcs.length === 0) {
        for (let i = 0; i < rxcui.length; i++) {
          (await Package.find({ rxcui: rxcui[i] })).forEach((v) => {
            ndcs.push(v.ndc11);
          });
        }
        if (ndcs.length === 0) {
          return;
        }
      }
      async function callback(data) {
        const source = selectSource(data.results);
        const { cin, ndc } = source;
        let package = await Package.findOne({ ndc11: ndc });
        if (!package) {
          const _package = await createPackage(ndc, "ndc11");
          package = await updatePackage(_package);
        }
        module.exports.updateProduct(package, { body: { cin } }, _callback);
      }
      const onError = {
        404: async function () {
          //
        },
      };
      requestPuppet("searchProducts", { queries: ndcs }, callback, onError);
    } catch (e) {
      console.log(e);
    }
  },
};
