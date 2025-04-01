const dayjs = require("dayjs");
const { scheduleJob } = require("node-schedule");
const { ps } = require("../../api/puppet");
const psPackage = require("./psPackage");
const psAlt = require("./psAlternative");
const { ndcToCMSNDC11, stringToNumber } = require("../convert");
const { setOptionParameters } = require("../common");

/**
 * @typedef {psPackage.Package} Package
 * @typedef {import("../../schemas/psAlternative").Result} Result
 * @typedef {object} Data
 * @property {string} value
 * @property {[Result]} results
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
 * @param {string} lotExpDate
 * @returns {dayjs.Dayjs}
 */
const isShortDated = (lotExpDate) => {
  return dayjs(lotExpDate, "MM/YY").isBefore(dayjs().add(11, "month"));
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
const selectQuery = (package) => {
  const { ndc, gtin } = package;
  if (ndc) {
    return { ndc11: ndcToCMSNDC11(ndc) };
  } else if (gtin) {
    return { query: gtinToQuery(gtin) };
  }
};

/**
 * Modifies each original result object.
 * @param {[Result]} results
 * @returns {undefined}
 */
const correctDescription = (results) => {
  results.forEach((v) => {
    const suffix = ` ${v.str} ${v.form} (${v.pkg})`;
    if (!v.description.endsWith(suffix)) {
      v.description += suffix;
    }
  });
};

/**
 * @param {[Result]} results
 * @param {string} cms
 * @returns {{item: Result|undefined, items: [Result]}}
 */
const filterResult = (results, cms) => {
  /** @type {Result|undefined} */
  let cheapestSameNdc;
  /** @type {Result|undefined} */
  let cheapestSameNdcShort;
  const table = {};
  results.forEach((v) => {
    const { description, unitPrice, ndc, lotExpDate } = v;
    if (!table[description]) {
      table[description] = v;
    } else if (
      stringToNumber(table[description].unitPrice) > stringToNumber(unitPrice)
    ) {
      table[description] = v;
    }
    if (ndc === cms) {
      if (isShortDated(lotExpDate)) {
        if (!cheapestSameNdcShort) {
          cheapestSameNdcShort = v;
        } else if (
          stringToNumber(cheapestSameNdcShort.unitPrice) >
          stringToNumber(unitPrice)
        ) {
          cheapestSameNdcShort = v;
        }
      } else {
        if (!cheapestSameNdc) {
          cheapestSameNdc = v;
        } else if (
          stringToNumber(cheapestSameNdc.unitPrice) > stringToNumber(unitPrice)
        ) {
          cheapestSameNdc = v;
        }
      }
    }
  });
  const items = [];
  for (const prop in table) {
    items.push(table[prop]);
  }
  return { item: cheapestSameNdc || cheapestSameNdcShort, items };
};

/**
 * @param {Package} package
 * @returns {Promise<undefined>}
 */
const handle404 = async (package) => {
  try {
    const alternative = package.alternative;
    if (alternative) {
      await psAlt.voidAlt(alternative);
    }
    await psPackage.voidItem(package);
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
    const { value, results } = data;
    const { ndc, ndc11, alternative } = package;
    correctDescription(results);
    const cms = ndc ? ndcToCMSNDC11(ndc) : value;
    const { item, items } = filterResult(results, cms);
    if (item) {
      if (!ndc11) {
        // update package via ps
      }
      await psPackage.handleResult(item);
    } else {
      await psPackage.voidItem(package);
    }
    if (alternative) {
      await psAlt.handleResult(alternative, items);
    }
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
      const result = await ps.getSearchResults(query);
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
    if (force || (await psPackage.needsUpdate(package))) {
      requestPuppet(package, callback);
    }
  } catch (e) {
    console.log(e);
  }
};
