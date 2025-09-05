const sl = require("../schemas/systemLog");
const dayjs = require("dayjs");

/**
 * @typedef {sl.SystemLog} SystemLog
 */

/**
 * @param {Date} date
 * @returns {Promise<SystemLog|undefined>}
 */
exports.upsertSl = async (date) => {
  try {
    return await sl.findOneAndUpdate(
      { date: dayjs(date).format("MM/DD/YYYY") },
      {},
      { new: true, upsert: true }
    );
  } catch (e) {
    console.error(e);
  }
};
