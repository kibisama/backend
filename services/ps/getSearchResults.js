// const dayjs = require("dayjs");
const { scheduleJob } = require("node-schedule");
const { ps } = require("../../api/puppet");
// const psAlt = require("./psAlternative");
const { ndcToCMSNDC11 } = require("../convert");
const { setDelay } = require("../common");

// /**
//  * @typedef {psPackage.Package} Package
//  * @typedef {import("../../schemas/psAlternative").Result} Result
//  * @typedef {object} Data
//  * @property {string} value
//  * @property {[Result]} results
//  */
/**
 * @typedef {import("./psPackage").PsPackage} PsPackage
 * @typedef {object} Data
 * @property {string|undefined} inputValue
 * @property {[import("../../schemas/ps/psAlternative").Result]} results
 */

// /**
//  * Returns a native Date object indicating m minutes from now.
//  * @param {*} m
//  * @returns {Date}
//  */
// const setDelay = (m) => {
//   return dayjs().add(m, "minute").toDate();
// };

// /**
//  * @param {string} lotExpDate
//  * @returns {boolean}
//  */
// const _isShortDated = (lotExpDate) => {
//   return isShortDated(lotExpDate, "MM/YY");
// };

// /**
//  * @param {string} gtin
//  * @returns {string}
//  */
// const gtinToQuery = (gtin) => {
//   return gtin.slice(3, 13);
// };

// /**
//  * Modifies each original result object.
//  * @param {[Result]} results
//  * @returns {undefined}
//  */
// const correctDescription = (results) => {
//   results.forEach((v) => {
//     const suffix = ` ${v.str} ${v.form} (${v.pkg})`;
//     if (!v.description.endsWith(suffix)) {
//       v.description += suffix;
//     }
//   });
// };

// /**
//  * @param {[Result]} results
//  * @param {string} cms
//  * @returns {{item: Result|undefined, items: [Result]}}
//  */
// const filterResult = (results, cms) => {
//   /** @type {Result|undefined} */
//   let cheapestSameNdc;
//   /** @type {Result|undefined} */
//   let cheapestSameNdcShort;
//   const table = {};
//   results.forEach((v) => {
//     const { description, unitPrice, ndc, lotExpDate } = v;
//     if (!table[description]) {
//       table[description] = v;
//     } else if (
//       stringToNumber(table[description].unitPrice) > stringToNumber(unitPrice)
//     ) {
//       table[description] = v;
//     }
//     if (ndc === cms) {
//       if (_isShortDated(lotExpDate)) {
//         if (!cheapestSameNdcShort) {
//           cheapestSameNdcShort = v;
//         } else if (
//           stringToNumber(cheapestSameNdcShort.unitPrice) >
//           stringToNumber(unitPrice)
//         ) {
//           cheapestSameNdcShort = v;
//         }
//       } else {
//         if (!cheapestSameNdc) {
//           cheapestSameNdc = v;
//         } else if (
//           stringToNumber(cheapestSameNdc.unitPrice) > stringToNumber(unitPrice)
//         ) {
//           cheapestSameNdc = v;
//         }
//       }
//     }
//   });
//   const items = [];
//   for (const prop in table) {
//     items.push(table[prop]);
//   }
//   return { item: cheapestSameNdc || cheapestSameNdcShort, items };
// };

// /**
//  * @param {Package} package
//  * @returns {Promise<undefined>}
//  */
// const handle404 = async (package) => {
//   try {
//     const alternative = package.alternative;
//     if (alternative) {
//       await psAlt.voidAlt(alternative);
//     }
//     await psPackage.voidItem(package);
//   } catch (e) {
//     console.log(e);
//   }
// };
// /**
//  * @param {Package} package
//  * @param {Data} data
//  * @returns {Promise<undefined>}
//  */
// const handle200 = async (package, data) => {
//   try {
//     const { value, results } = data;
//     const { ndc, ndc11, alternative } = package;
//     correctDescription(results);
//     const cms = ndc ? ndcToCMSNDC11(ndc) : value;
//     const { item, items } = filterResult(results, cms);
//     if (item) {
//       if (!ndc11) {
//         // update package via ps
//       }
//       await psPackage.handleResult(package, item);
//     } else {
//       await psPackage.voidItem(package);
//     }
//     if (alternative) {
//       await psAlt.handleResult(alternative, items);
//     }
//   } catch (e) {
//     console.log(e);
//   }
// };

/**
 * @typedef {object} Body
 * @property {string} ndc11
 */

/**
 * @param {PsPackage} psPackage populated
 * @returns {Body|undefined}
 */
const selectQuery = (psPackage) => {
  const { ndc, ndc11 } = psPackage.package;
  if (ndc11) {
    return { ndc11: ndc11.replaceAll("-", "") };
  } else if (ndc) {
    return { ndc11: ndcToCMSNDC11(ndc) };
  }
};

/**
 * @param {PsPackage} psPackage
 * @param {function} callback
 * @returns {Promise<void>}
 */
module.exports = async (psPackage, callback) => {
  await psPackage.populate({ path: "package" });
  const query = selectQuery(psPackage);
  if (!query) {
    return;
  }
  let count = 0;
  const maxCount = 9;
  async function request() {
    try {
      const result = await ps.getSearchResults(query);
      if (result instanceof Error) {
        switch (result.status) {
          case 400:
            break;
          case 404:
            callback(null, psPackage);
            break;
          case 500:
            if (count < maxCount) {
              count++;
              scheduleJob(setDelay(15), request);
            }
            break;
          case 503:
            scheduleJob(setDelay(3), request);
            break;
          default:
        }
      } else {
        callback(result.data, psPackage);
      }
    } catch (e) {
      console.error(e);
    }
  }
  request();
};
