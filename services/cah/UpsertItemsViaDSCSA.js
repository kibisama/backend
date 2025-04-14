const dayjs = require("dayjs");
const { cardinal } = require("../../api/puppet");
const item = require("../inv/item");
const package = require("../inv/package");
const { scheduleJob } = require("node-schedule");
const { isStoreOpen } = require("../common");
const { hyphenateNDC11 } = require("../convert");

/**
 * Returns a native Date object indicating m minutes from now.
 * @param {Parameters<dayjs.Dayjs["add"]>["0"]} m
 * @returns {Date}
 */
const setDelay = (m) => {
  return dayjs().add(m, "minute").toDate();
};
/**
 * @param {string} date "MM/DD/YYYY"
 * @param {Function} [callback]
 * @returns {void}
 */
const requestPuppet = (date, callback) => {
  let count = 0;
  const maxCount = 99;
  async function request() {
    try {
      const result = await cardinal.getDSCSAData({ date });
      if (result instanceof Error) {
        switch (result.status) {
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
        if (count === maxCount) {
          //
        }
      } else {
        handleResults(result.data.results);
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
 * Formats a Date or a Dayjs object to a query date string.
 * Returns today's if the date is undefined.
 * @param {Date|dayjs.Dayjs} [date]
 * @returns {string}
 */
const formatDateQuery = (date) => {
  return dayjs(date).format("MM/DD/YYYY");
};
/**
 * Formats a Result date string into a DM date string.
 * @param {string} exp
 * @returns {string}
 */
const formatExpString = (exp) => {
  return dayjs(exp, "YYYY-MM-DD").format("YYMMDD");
};
/**
 * @param {} result
 * @returns {item.ScanReq}
 */
const createVirtualScanReq = (result) => {
  return {
    mode: "RECEIVE",
    source: "CARDINAL",
    gtin: result.GTIN,
    lot: result["Lot Number"],
    sn: result["Item Serial Number"],
    exp: formatExpString(result["Expiration Date"]),
  };
};
/**
 * @param {} results
 * @returns {Promise<number|undefined>}
 */
const handleResults = async (results) => {
  try {
    let number = 0;
    if (results.length > 0) {
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const { NDC, GTIN } = result;
        const cms = NDC.replaceAll("-", ""); // NDC can be either CMS or with hyphens
        if (cms.length === 11) {
          const scanReq = createVirtualScanReq(result);
          const _item = await item.upsertItem(scanReq, "DSCSA");
          if (!_item.dateReceived) {
            await item.updateItem(scanReq);
          }
          let pkg = await package.crossUpsertPackage({
            ndc11: hyphenateNDC11(cms),
            gtin: GTIN,
          });
          if (!_item.dateFilled) {
            await package.updateInventories(_item, "RECEIVE");
          }
          number++;
        }
      }
    } else {
      // make error notification
    }
    return number;
  } catch (e) {
    console.log(e);
  }
};
/**
 * @returns {Date}
 */
const getNextScheduleDate = () => {
  return dayjs()
    .add(1, "day")
    .set("hour", 8)
    .set("minute", 0)
    .set("second", 0)
    .toDate();
};
/**
 * @returns {void}
 */
const scheduleUpsert = () => {
  const nextScheduleDate = getNextScheduleDate();
  if (isStoreOpen()) {
    requestPuppet(formatDateQuery());
  }
  scheduleJob(nextScheduleDate, () => {
    requestPuppet(formatDateQuery(nextScheduleDate));
  });
};

module.exports = { scheduleUpsert, handleResults };
