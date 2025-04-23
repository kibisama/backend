const sl = require("../schemas/systemLog");

/**
 * @typedef {sl.SystemLog} SystemLog
 * @typedef {object} Base
 * @prop {string} msg
 * @prop {string} type
 * @prop {string} date MM/DD/YYYY
 * @prop {string} [status]
 */

/**
 * @param {Base}
 * @returns {Parameters<sl["findOne"]>["0"]}
 */
const createBase = ({ msg, type, date, status }) => {
  return { msg, type, status, date, createdAt: new Date() };
};

/**
 * @param {Base}
 * @returns {Promise<SystemLog|undefined>}
 */
const createSl = async (base) => {
  try {
    return await sl.create(createBase(base));
  } catch (e) {
    console.log(e);
  }
};

/**
 * @param {SystemLog} sl
 * @param {string} status
 * @returns {Promise<void>}
 */
const setStatus = async (sl, status) => {
  try {
    await sl.updateOne({ $set: { status } });
  } catch (e) {
    console.log(e);
  }
};

/**
 * @param {SystemLog} sl
 * @param {string} status
 * @returns {Promise<void>}
 */
const setActive = async (sl) => {
  try {
    await sl.updateOne({ $set: { active: false } });
  } catch (e) {
    console.log(e);
  }
};

const getActiveLogs = async () => {
  try {
    return await sl.find({ active: true }).sort({ date: -1 });
  } catch (e) {
    console.log(e);
  }
};

module.exports = {
  getActiveLogs,
  setStatus,
  setActive,
};
