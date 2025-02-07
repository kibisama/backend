const dayjs = require("dayjs");
const { scheduleJob } = require("node-schedule");
const { cardinal } = require("../../api/puppet");

/**
 * Request the Puppeteer server.
 * @param {string} method
 * @param {any} arg argument
 * @param {function} callback
 * @param {object} onError
 * @returns {Promise<undefined>}
 */
module.exports = async function (method, arg, callback, onError = {}) {
  let count = 0;
  const maxCount = 99;
  /**
   * Inner function that requests Puppeteer server to update Cardinal product.
   * @returns {Promise<undefined>}
   */
  async function update() {
    const result = await cardinal[method](arg);
    if (result instanceof Error) {
      const status = result.status;
      const handler = onError[status];
      if (handler instanceof Function) {
        handler();
      } else {
        switch (status) {
          case 404:
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
      }
    } else {
      if (callback instanceof Function) {
        callback(result.data);
      }
    }
  }
  try {
    return await update();
  } catch (e) {
    console.log(e);
  }
};
