const dayjs = require("dayjs");
const { cardinal } = require("../../api/puppet");
const item = require("../inv/item");
const { upsertCompletePackage, updateInventories } = require("../inv/package");
const { upsertSl } = require("../systemLog");
const { scheduleJob } = require("node-schedule");
const { isStoreOpen, isShortDated, setDelay } = require("../common");
const { hyphenateNDC11 } = require("../convert");
const nodemailer = require("../nodemailer");

/**
 * Returns a Date of the date string if it is not today.
 * @param {string} date "MM/DD/YYYY"
 * @returns {Date|undefined}
 */
const getDate = (date) => {
  const day = dayjs(date, "MM/DD/YYYY");
  return dayjs().isSame(day, "day")
    ? undefined
    : day.set("hour", 8).set("minute", 0).set("second", 0).toDate();
};

/**
 * @param {} restuls
 * @returns {string}
 */
const generateHtmlTable = (results) => {
  return `
            <div>
              <table>
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>CIN</th>
                    <th>NDC</th>
                    <th>Desc.</th>
                    <th>GTIN</th>
                    <th>Lot #</th>
                    <th>Serial #</th>
                    <th>Exp Date</th>
                    <th>Tote ID</th>
                  </tr>
                </thead>
                <tbody>
                  ${results
                    .map(
                      (v) => `
                  <tr>
                    <td>${v["Invoice Number"]}</td>
                    <td>${v["Item Number"]}</td>
                    <td>${v["NDC"]}</td>
                    <td>${v["Item Description"]}</td>
                    <td>${v["GTIN"]}</td>
                    <td>${v["Lot Number"]}</td>
                    <td>${v["Item Serial Number"]}</td>
                    <td>${v["Expiration Date"]}</td>
                    <td>${v["Tote ID"]}</td>
                  </tr>
                  `
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
            `;
};
/**
 * @param {} result
 * @returns {void}
 */
const mailReport = (result) => {
  const { results, number, shortDated } = result;
  nodemailer.sendMail(
    {
      from: process.env.MAILER_EMAIL,
      to: process.env.MAILER_EMAIL,
      subject: "Cardinal DSCSA Transaction Report",
      html: `
        <div>
          <p>Total ${number} transactions were recorded in our system.</p>
          <br/>
          <h3>Short Dated Item List</h3>
        ${
          shortDated.length > 0
            ? generateHtmlTable(shortDated)
            : "<p>No short dated items</p>"
        }
          <br/>
          <h3>All Transaction List</h3>
        ${generateHtmlTable(results)}
        </div>
        `,
    },
    async (err, info) => {
      if (err) {
        console.error(err);
        return;
      }
      const sl = await upsertSl(date);
      await sl.updateOne({
        $set: { CAH_UPSERT_ITEMS_VIA_DSCSA: true },
      });
    }
  );
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
 * @param {string} date "MM/DD/YYYY"
 * @returns {Promise<number|undefined>}
 */
const handleResults = async (results, date) => {
  try {
    let number = 0;
    if (results.length > 0) {
      const table = {};
      const shortDated = [];
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const { NDC, GTIN } = result;
        const cms = NDC.replaceAll("-", ""); // NDC can be either CMS or with hyphens
        if (cms.length === 11) {
          const scanReq = createVirtualScanReq(result);
          const _item = await item.upsertItem(
            scanReq,
            "DSCSA",
            result["Invoice Number"]
          );
          !_item.dateReceived &&
            (await item.updateItem(scanReq, getDate(date)));
          !table[GTIN] &&
            (await upsertCompletePackage({
              ndc11: hyphenateNDC11(cms),
              gtin: GTIN,
            }));
          !_item.dateFilled && (await updateInventories(_item, "RECEIVE"));
          isShortDated(scanReq.exp, "YYMMDD") && shortDated.push(result);
          table[GTIN] = true;
          number++;
        }
      }
      mailReport({ results, number, shortDated });
    } else {
      // DSCSA data not yet updated
      // make attempt failed notification
    }
    return number;
  } catch (e) {
    console.error(e);
  }
};

/**
 * @param {string} date "MM/DD/YYYY"
 * @returns {void}
 */
const requestPuppet = (date) => {
  let count = 0;
  const maxCount = 9;
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
          // mail notice of failure
        }
      } else {
        handleResults(result.data.data, date);
      }
    } catch (e) {
      console.error(e);
    }
  }
  request();
};
/**
 * @returns {dayjs.Dayjs}
 */
const getNextScheduleDate = () => {
  const now = dayjs();
  const scheduledTime = dayjs()
    .set("hour", 8)
    .set("minute", 0)
    .set("second", 0);
  if (now.isBefore(scheduledTime)) {
    return scheduledTime;
  } else {
    return scheduledTime.add(1, "day");
  }
};
/**
 * @returns {Promise<void>}
 */
const scheduleUpsert = async () => {
  if (isStoreOpen()) {
    const { date, CAH_UPSERT_ITEMS_VIA_DSCSA } = await upsertSl();
    !CAH_UPSERT_ITEMS_VIA_DSCSA && requestPuppet(date);
  }
  scheduleJob(getNextScheduleDate(), scheduleUpsert);
};

module.exports = { requestPuppet, scheduleUpsert };
