// const { ndc } = require("../../api/openfda");
// const { gtinToNDC, ndc11StringToNDCRegExp } = require("../convert");

// /**
//  * @typedef {import("../inv/package").ArgType} ArgType
//  * @typedef {object} Response
//  * @property {Meta} meta
//  * @property {[Results]} results
//  * @typedef {object} Meta
//  * @property {MetaResults} results
//  * @typedef {object} Results
//  * @property {string} product_ndc
//  * @property {string} generic_name
//  * @property {string} labeler_name
//  * @property {string} brand_name
//  * @property {[ActiveIngredients]} active_ingredients
//  * @property {[Packaging]} packaging
//  * @typedef {object} MetaResults
//  * @property {number} skip
//  * @property {number} limit
//  * @property {number} total
//  * @typedef {object} ActiveIngredients
//  * @property {string} name
//  * @property {string} strength
//  * @typedef {object} Packaging
//  * @property {string} package_ndc
//  * @property {string} description
//  * @property {string} marketing_start_date
//  * @property {boolean} sample
//  * @typedef {object} OpenFDA
//  * @property {[string]} manufacturer_name
//  * @property {[string]} rxcui
//  * @property {[string]} spl_set_id
//  * @property {[boolean]} is_original_packager
//  * @property {[string]} upc
//  * @property {[string]} unii
//  * @typedef {object} Output
//  * @property {string} ndc
//  * @property {string} description
//  */

// /**
//  * @param {string} arg
//  * @param {ArgType} type
//  * @returns {string}
//  */
// const getQuery = (arg, type) => {
//   let query = "";
//   switch (type) {
//     case "ndc":
//       query = `"${arg}"`;
//       break;
//     case "ndc11":
//       query = ndc11StringToNDCRegExp(arg)
//         .source.split("|")
//         .map((v) => `"${v}"`)
//         .join("+");
//       break;
//     case "gtin":
//       query = gtinToNDC(arg)
//         .map((v) => `"${v}"`)
//         .join("+");
//       break;
//     default:
//   }
//   return query;
// };

// /**
//  * @param {string} arg
//  * @param {ArgType} type
//  * @param {[Packaging]} packaging
//  * @returns {{ndc: string, description: string}|undefined}
//  */
// const selectPackagingDesc = (arg, type, packaging) => {
//   let regex;
//   switch (type) {
//     case "ndc":
//       regex = new RegExp(String.raw`${arg}`);
//       break;
//     case "ndc11":
//       regex = ndc11StringToNDCRegExp(arg);
//       break;
//     case "gtin":
//       regex = new RegExp(String.raw`${gtinToNDC(arg).join("|")}`);
//       break;
//     default:
//   }
//   for (let i = 0; i < packaging.length; i++) {
//     const description = packaging[i].description;
//     const match = description.match(regex);
//     if (match) {
//       return { ndc: match[0], description };
//     }
//   }
// };
// /**
//  * @param {string} description
//  * @param {string} ndc
//  * @returns {string}
//  */
// const trimDesc = (description, ndc) => {
//   const filterRegex = new RegExp(String.raw`[^*]+\(${ndc}\)?[^*]+`);
//   const filterMatch = description.match(filterRegex);
//   const filteredDesc = filterMatch ? filterMatch[0].trim() : description;
//   const regex = new RegExp(String.raw`[^\/]+\(${ndc}\).*`);
//   return filteredDesc.match(regex)[0].trim();
// };

// /**
//  * @param {string} arg
//  * @param {ArgType} type
//  * @returns {Promise<Output|undefined>}
//  */
// module.exports = async (arg, type) => {
//   try {
//     const query = getQuery(arg, type);
//     const result = await ndc.searchOneByPackageDescription(query);
//     if (result instanceof Error) {
//       return;
//     }
//     /** @type {Response} */
//     const data = result.data;
//     if (data.meta.results.total > 1) {
//       return;
//     }
//     const results = data.results[0];
//     /** @type {Output} */
//     const output = {};
//     const pkgDesc = selectPackagingDesc(arg, type, results.packaging);
//     if (pkgDesc) {
//       const { ndc, description } = pkgDesc;
//       output.ndc = ndc;
//       output.description = trimDesc(description, ndc);
//     }
//     return output;
//   } catch (e) {
//     console.log(e);
//   }
// };
