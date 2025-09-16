const dayjs = require("dayjs");
const { scheduleJob } = require("node-schedule");
const item = require("../inv/item");
const { findPackageByGTIN } = require("../inv/package");
const nodemailer = require("../nodemailer");
const settings = require("../apps/settings");
const common = require("../common");
const { upsertSl } = require("../systemLog");

/**
 * @typedef {object} ReturnItem
 * @property {string} gtin
 * @property {string} sn
 * @property {string} invoiceRef
 * @property {string} [cost]
 * @property {string} [cin]
 * @property {string} [ndc]
 * @typedef {item.Item} Item
 */

/**
 * @param {Item} item
 * @returns {common.Response}
 */
exports.checkItemCondition = (item) => {
  const { dateReceived, exp, invoiceRef } = item;
  if (!invoiceRef) {
    return {
      code: 409,
      message: "The invoice number has not recorded for the item.",
    };
  }
  const today = dayjs();
  const dayExp = dayjs(exp, "YYMMDD");
  if (dayExp.isBefore(today.add(200, "day"))) {
    return {
      code: 409,
      message: "The expiration date is too short (less than 200 days).",
    };
  }
  const dayDateReceived = dayjs(dateReceived);
  if (dayDateReceived.isBefore(today.subtract(1, "year"))) {
    return {
      code: 409,
      message:
        "Cardinal does not accept returning items passed more than 1 year.",
    };
  } else if (dayDateReceived.isBefore(today.subtract(350, "days"))) {
    return {
      code: 202,
      message:
        "The item has passed more than 350 days. Cardinal might not issue RMA.",
    };
  } else if (dayDateReceived.isBefore(today.subtract(180, "day"))) {
    return {
      code: 202,
      message:
        "The item has passed more than 180 days. Cardinal will not issue the full credit.",
    };
  } else if (dayDateReceived.isBefore(today.subtract(170, "day"))) {
    return {
      code: 202,
      message:
        "The item has passed more than 170 days. Cardinal might not issue the full credit.",
    };
  } else {
    return { code: 200 };
  }
};

/**
 * @returns {Promise<[Item]|undefined>}
 */
const findReturnedItems = async () => {
  try {
    return await item.findReturnedItems(undefined, "CARDINAL");
  } catch (e) {
    console.error(e);
  }
};

/**
 * @param {[Item]} items
 * @returns {Promise<[ReturnItem]|undefined>}
 */
const mapItems = async (items) => {
  try {
    const table = {};
    for (let i = 0; i < items.length; i++) {
      const { gtin } = items[i];
      if (!table[gtin]) {
        const package = await findPackageByGTIN(gtin);
        await package.populate("cahProduct");
        table[gtin] = {};
        const _ = (table[gtin] = {});
        _.ndc = package.ndc11;
        _.cin = package.cahProduct.cin;
      }
    }
    const returnItems = [];
    items.forEach((v) => {
      (table[v.gtin]?.cin || table[v.gitn]?.ndc) &&
        returnItems.push({
          gtin: v.gtin,
          sn: v.sn,
          invoiceRef: v.invoiceRef,
          cost: v.cost,
          cin: table[v.gtin]?.cin,
          ndc: table[v.gitn]?.ndc,
        });
    });
    return returnItems;
  } catch (e) {
    console.error(e);
  }
};

/**
 * @returns {Promise<void>}
 */
const requestReturns = async () => {
  try {
    const items = await findReturnedItems();
    if (items.length > 0) {
      const returnItems = await mapItems(items);
      returnItems.length > 0 &&
        mailReport(returnItems, await settings.getSettings());
    }
  } catch (e) {
    console.error(e);
  }
};

/**
 * @param {[ReturnItem]} items
 * @param {settings.Settings} settings
 * @returns {void}
 */
const mailReport = (items, settings) => {
  const acctNumber = process.env.CARDINAL_ACCOUNT_NUMBER;
  const acctName = process.env.CARDINAL_ACCOUNT_NAME;
  if (!(acctNumber && acctName)) {
    return;
  }
  const {
    storeName,
    storeAddress,
    storeCity,
    storeState,
    storeZip,
    storePhone,
    storeFax,
    storeEmail,
  } = settings;
  nodemailer.sendMail(
    {
      from: process.env.MAILER_EMAIL,
      to: process.env.CARDINAL_CS_EMAIL || process.env.MAILER_EMAIL,
      subject: "RMA request",
      html: `
        <div>
          <p>
            Account Name: ${acctName}
            <br/>
            Account Number: ${acctNumber}
            <br/>
            Contact Information:
            <br/>
            ${storeName}
            <br/>
            ${storeAddress}
            <br/>
            ${storeCity}, ${storeState} ${storeZip}
            <br/>
            Phone ${storePhone}
            <br/>
            Fax ${storeFax}
            <br/>
            Email ${storeEmail}
          </p>
          <br/>
          <p style="font-size: 14px;">Please create MRA for the following item(s):</p>
          <br/>
        ${generateHtmlTable(items)}
        </div>
        `,
    },
    async (err, info) => {
      if (err) {
        console.error(err);
        return;
      }
      const sl = await upsertSl();
      await sl.updateOne({
        $set: { CAH_RETURN_REQUEST: true },
      });
    }
  );
};

/**
 * @param {[ReturnItem]} items
 * @returns {string}
 */
const generateHtmlTable = (items) => {
  return `
          <div>
            <table style="border-collapse: collapse;border: 3px solid black;">
              <thead style="border-bottom: 3px solid black;background: #CFCFCF;background: -moz-linear-gradient(top, #dbdbdb 0%, #d3d3d3 66%, #CFCFCF 100%);background: -webkit-linear-gradient(top, #dbdbdb 0%, #d3d3d3 66%, #CFCFCF 100%);background: linear-gradient(to bottom, #dbdbdb 0%, #d3d3d3 66%, #CFCFCF 100%);font-size: 16px;font-weight: bold;color: black;">
                <tr>
                  <th style="padding: 5px 4px;border: 1px solid black;min-width: 60px;">#</th>
                  <th style="padding: 5px 4px;border: 1px solid black;min-width: 140px;">Invoice #</th>
                  <th style="padding: 5px 4px;border: 1px solid black;min-width: 140px;">CIN/NDC</th>
                  <th style="padding: 5px 4px;border: 1px solid black;min-width: 160px;">GTIN</th>
                  <th style="padding: 5px 4px;border: 1px solid black;min-width: 200px;">Serial #</th>
                  <th style="padding: 5px 4px;border: 1px solid black;min-width: 140px;">Reason</th>
                </tr>
              </thead>
              <tbody style="font-size: 14px;">
                ${items
                  .map(
                    (v, i) => `
                    <tr>
                      <td style="padding: 5px 4px;border: 1px solid black;">${(
                        i + 1
                      ).toString()}</td>
                      <td style="padding: 5px 4px;border: 1px solid black;">${
                        v.invoiceRef
                      }</td>
                      <td style="padding: 5px 4px;border: 1px solid black;">${
                        v.cin || v.ndc
                      }</td>
                      <td style="padding: 5px 4px;border: 1px solid black;">${
                        v.gtin
                      }</td>
                      <td style="padding: 5px 4px;border: 1px solid black;">${
                        v.sn
                      }</td>
                      <td style="padding: 5px 4px;border: 1px solid black;">Overstock</td>
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
 * @returns {dayjs.Dayjs}
 */
const getNextScheduleDate = () => {
  const scheduledTime = getScheduleTime();
  if (dayjs().isBefore(scheduledTime)) {
    return scheduledTime;
  } else {
    return scheduledTime.add(1, "day");
  }
};
/**
 * @returns {dayjs.Dayjs}
 */
const getScheduleTime = () =>
  dayjs().set("hour", 21).set("minute", 0).set("second", 0);

/**
 * @returns {Pormise<void>}
 */
exports.scheduleRequest = async () => {
  if (common.isStoreOpen() && dayjs().add(1, "s").isAfter(getScheduleTime())) {
    const { CAH_RETURN_REQUEST } = await upsertSl();
    !CAH_RETURN_REQUEST && requestReturns();
  }
  scheduleJob(getNextScheduleDate(), exports.scheduleRequest);
};
