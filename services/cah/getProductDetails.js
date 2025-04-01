const fs = require("fs");
const dayjs = require("dayjs");
const axios = require("axios");
const { scheduleJob } = require("node-schedule");
const { cardinal } = require("../../api/puppet");
const cahProduct = require("./cahProduct");
// const psAlt = require("./psAlternative");
// const { ndcToCMSNDC11, stringToNumber } = require("../convert");
const { setOptionParameters } = require("../common");

const defaultImgUrl =
  "https://cardinalhealth.bynder.com/transform/pharma-medium/6f60cc86-566e-48e2-8ab4-5f78c4b53f74/";

/**
 * @typedef {cahProduct.Package} Package
 * @typedef {import("../../schemas/cahProduct").CAHData} CAHData
 * @typedef {import("../../schemas/cahProduct").BooleanIcon} BooleanIcon
 * @typedef {object} Data
 * @property {Result} results
 * @typedef {Alt & Product} Result
 * @typedef {object} Product
 * @property {string} img
 * @property {CAHData} gtin
 * @property {[Alt]} alts
 * @typedef {object} Alt
 * @property {CAHData} name
 * @property {CAHData} genericName
 * @property {CAHData} ndc
 * @property {CAHData} cin
 * @property {CAHData} upc
 * @property {CAHData} mfr
 * @property {CAHData} orangeBookCode
 * @property {CAHData} estNetCost
 * @property {CAHData} netUoiCost
 * @property {CAHData} lastOrdered
 * @property {string} [contract]
 * @property {import("../../schemas/cahProduct").StockStatus} stockStatus
 * @property {string} [stock]
 * @property {import("../../schemas/cahProduct").BooleanIcon} rebateEligible
 * @property {import("../../schemas/cahProduct").BooleanIcon} returnable
 */

/**
 * Returns a native Date object indicating m minutes from now.
 * @param {*} m
 * @returns {Date}
 */
const setDelay = (m) => {
  return dayjs().add(m, "minute").toDate();
};

/**
 * @param {string} gtin
 * @returns {string}
 */
const gtinToQuery = (gtin) => {
  return gtin.slice(3, 13);
};

/**
 * @typedef {object} Body
 * @property {string} [ndc11]
 * @property {string} [query]
 */

/**
 * @param {Package} package
 * @returns {Body}
 */
const selectQuery = async (package) => {
  const { cahProduct, ndc, gtin } = package;
  if (cahProduct) {
    const populated = await package.populate([
      { path: "cahProduct", select: ["cin"] },
    ]);
    const cin = populated.cahProduct.cin;
    if (cin) {
      return { cin };
    }
  }
  if (ndc) {
    return { query: ndc };
  } else if (gtin) {
    return { query: gtinToQuery(gtin) };
  }
};

/**
 * @param {Package} package
 * @returns {Promise<undefined>}
 */
const handle404 = async (package) => {
  try {
    await cahProduct.voidProduct(package);
    // optional update alternative
  } catch (e) {
    console.log(e);
  }
};

/**
 * @param {Package} package
 * @param {Data} data
 * @returns {Promise<undefined>}
 */
const handle200 = async (package, data) => {
  try {
    const {} = data.results;

    const { ndc11, gtin, alternative } = package;
    if (!ndc11 || !gtin) {
      // update package via cah
    }
  } catch (e) {
    console.log(e);
  }
};

/**
 * @param {Result} result
 * @returns {Promise<undefined>}
 */
const saveImg = async (result) => {
  try {
    const { cin, img } = result;
    const path = `img/pharma-medium/${cin}.jpg`;
    fs.access(path, fs.constants.F_OK, async (err) => {
      if (err) {
        if (img && img !== defaultImgUrl) {
          const { data } = await axios.get(img, {
            responseType: "arraybuffer",
          });
          if (data) {
            fs.writeFileSync(path, data);
          }
        }
      }
    });
  } catch (e) {
    console.log(e);
  }
};

/**
 * @param {Package} package
 * @param {Function} [callback]
 * @returns {undefined}
 */
const requestPuppet = (package, callback) => {
  const query = selectQuery(package);
  let count = 0;
  const maxCount = 99;
  async function request() {
    try {
      const result = await cardinal.getProductDetails(query);
      if (result instanceof Error) {
        switch (result.status) {
          case 404:
            await handle404(package);
            break;
          case 500:
            if (count < maxCount) {
              count++;
              scheduleJob(setDelay(5), request);
            }
            break;
          case 503:
            scheduleJob(setDelay(3), request);
            break;
          default:
        }
      } else {
        await handle200(package, result.data);
        if (callback instanceof Function) {
          callback();
        }
      }
    } catch (e) {
      console.log(e);
    }
  }
  request();
};

/**
 * @typedef {object} RequestOption
 * @property {boolean} [force]
 * @property {Function} [callback]
 */

/**
 * @param {Package} package
 * @param {RequestOption} [option]
 * @returns {Promise<undefined>}
 */
module.exports = async (package, option) => {
  try {
    const defaultOption = { force: false };
    const { force, callback } = setOptionParameters(defaultOption, option);
    if (force || (await cahProduct.needsUpdate(package))) {
      requestPuppet(package, callback);
    }
  } catch (e) {
    console.log(e);
  }
};
