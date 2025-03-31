const dayjs = require("dayjs");
const { scheduleJob } = require("node-schedule");
const { cardinal } = require("../../api/puppet");
const cahProduct = require("./cahProduct");
// const psAlt = require("./psAlternative");
// const { ndcToCMSNDC11, stringToNumber } = require("../convert");
const { setOptionParameters } = require("../common");

/**
 * @typedef {cahProduct.Package} Package
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
        // await handle200(package, result.data);
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
      //   requestPuppet(package, callback);
    }
  } catch (e) {
    console.log(e);
  }
};
