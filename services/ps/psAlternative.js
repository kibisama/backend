// const psAlt = require("../../schemas/psAlternative");
// const alternative = require("../../schemas/inv/alternative");

// /**
//  * @typedef {import("mongoose").ObjectId} ObjectId
//  * @typedef {psAlt.PSAlternative} PSAlternative
//  * @typedef {psAlt.Result} Result
//  * @typedef {Parameters<psAlt["findOneAndUpdate"]>["0"]} Filter
//  * @typedef {Parameters<psAlt["findOneAndUpdate"]>["1"]} UpdateParam
//  */

// /**
//  * @returns {UpdateParam}
//  */
// const createUpdateParam = () => {
//   return { $set: { lastUpdated: new Date() } };
// };
// /**
//  * @param {ObjectId} alternative
//  * @returns {Filter}
//  */
// const createFilter = (alternative) => {
//   return { alternative };
// };
// /**
//  * @param {ObjectId} alternative
//  * @returns {typeof psAlt.schema.obj}
//  */
// const createBase = (alternative) => {
//   return {
//     lastUpdated: new Date(),
//     alternative,
//   };
// };
// /**
//  * @param {ObjectId} alt
//  * @returns {Promise<PSAlternative|undefined>}
//  */
// const findAlt = async (alt) => {
//   try {
//     return (await psAlt.findOne(createFilter(alt))) ?? undefined;
//   } catch (e) {
//     console.log(e);
//   }
// };
// /**
//  * @param {ObjectId} alt
//  * @returns {Promise<PSAlternative|undefined>}
//  */
// const createAlt = async (alt) => {
//   try {
//     const _psAlt = await psAlt.create(createBase(alt));
//     await alternative.findByIdAndUpdate(alt, { psAlternative: _psAlt._id });
//     return _psAlt;
//   } catch (e) {
//     console.log(e);
//   }
// };
// /**
//  * @param {ObjectId} alt
//  * @returns {Promise<PSAlternative|undefined>}
//  */
// const voidAlt = async (alt) => {
//   try {
//     const _psAlt = await findAlt(alt);
//     if (!_psAlt) {
//       return await createAlt(alt);
//     } else if (_psAlt.active) {
//       const updateParam = createUpdateParam();
//       updateParam.$set.active = false;
//       return await psAlt.findOneAndUpdate(createFilter(alt), updateParam, {
//         new: true,
//       });
//     }
//     return _psAlt;
//   } catch (e) {
//     console.log(e);
//   }
// };
// /**
//  * @param {ObjectId} alt
//  * @returns {Promise<PSAlternative|undefined>}
//  */
// const upsertAlt = async (alt) => {
//   try {
//     const _alt = await findAlt(alt);
//     if (!_alt) {
//       return await createAlt(alt);
//     }
//     return _alt;
//   } catch (e) {
//     console.log(e);
//   }
// };
// /**
//  * @param {ObjectId} alt
//  * @param {[Result]} results
//  * @returns {Promise<undefined>}
//  */
// const handleResult = async (alt, results) => {
//   try {
//     const _alt = await upsertAlt(alt);
//     if (_alt) {
//       const updateParam = createUpdateParam();
//       updateParam.$set.active = true;
//       updateParam.$set.items = results;
//       await _alt.updateOne(updateParam);
//     }
//   } catch (e) {
//     console.log(e);
//   }
// };

// module.exports = { voidAlt, handleResult };
