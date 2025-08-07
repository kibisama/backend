const dayjs = require("dayjs");
const { scheduleJob } = require("node-schedule");
const item = require("../inv/item");
const package = require("../inv/package");
const CahProduct = require("../../schemas/cahProduct");
const nodeMailer = require("../nodeMailer");
const { getSettings } = require("../apps/settings");
const common = require("../common");

/**
 * @typedef {object} ReturnItem
 * @property {string} gtin
 * @property {string} sn
 * @property {string} [invoiceRef]
 * @property {string} [cost]
 * @property {string} [cin]
 * @property {string} [ndc]
 * @typedef {item.Item} Item
 */

/**
 * @returns {Promise<[Item]|undefined>}
 */
const findReturnedItems = async () => {
  try {
    return await item.findReturnedItems(dayjs(), "CARDINAL");
  } catch (e) {
    console.log;
  }
};

/**
 * @param {[Item]} items
 * @returns {Promise<[{}]|undefined>}
 */
const mapItems = async (items) => {
  try {
    const ndcTable = {};
    items.forEach(async (v) => {
      const { gtin } = v;
      if (!ndcTable[gtin]) {
        try {
          const package = await package.findPackage(gtin, "gtin");
          ndcTable[gtin] = package.ndc11 || "";
        } catch (e) {
          console.error(e);
        }
      }
    });
    const cinTable = {};
    Object.keys(ndcTable).forEach(async (v) => {
      try {
        const ndc = ndcTable[v];
        if (ndc) {
          const cahPrd = await CahProduct.findOne({ ndc });
          if (cahPrd) {
            cinTable[v] = cahPrd.cin;
          }
        }
      } catch (e) {
        console.error(e);
      }
    });
    return items.map((v) => {
      return {
        invoiceRef: v.invoiceRef,
        cin: cinTable[v.gtin],
        ndc: ndcTable[v.gtin],
        sn: v.sn,
      };
    });
  } catch (e) {
    console.log(e);
  }
};

/**
 *
 */
const processReturns = async () => {
  try {
  } catch (e) {
    console.log(e);
  }
};

/**
 * @returns {dayjs.Dayjs}
 */
const getNextScheduleDate = () => {
  return dayjs()
    .add(1, "day")
    .set("hour", 23)
    .set("minute", 55)
    .set("second", 0)
    .toDate();
};

/**
 *
 */
const scheduleMailer = async () => {
  if (common.isStoreOpen()) {
  }
  const items = await findReturnedItems();
  if (items.length > 0) {
  }
};

/**
 * @param {Item} item
 * @returns {common.Response}
 */
exports.checkDateReceived = (item) => {
  const { dateReceived } = item;
  const today = dayjs();
  const dayDateReceived = dayjs(dateReceived);
  if (dayDateReceived.isAfter(today.add(1, "year"))) {
    return {
      code: 409,
      message:
        "Cardinal does not accept returning items passed more than 1 year.",
    };
  } else if (dayDateReceived.isAfter(today.add(355, "days"))) {
    return {
      code: 200,
      message:
        "The item has passed more than 355 days, so Cardinal might not issue RMA.",
    };
  } else if (dayDateReceived.isAfter(today.add(180, "day"))) {
    return {
      code: 200,
      message:
        "The item has passed more than 180 days, so Cardinal will not issue the full credit.",
    };
  } else if (dayDateReceived.isAfter(today.add(170, "day"))) {
    return {
      code: 200,
      message:
        "The item has passed more than 170 days, so Cardinal might not issue the full credit.",
    };
  } else {
    return { code: 200 };
  }
};

/**
 *
 */
const mailReport = async () => {
  try {
    const {
      storeName,
      storeAddress,
      storeCity,
      storeState,
      storeZip,
      storePhone,
      storeFax,
      storeEmail,
    } = await getSettings();
    nodeMailer.sendMail(
      {
        from: process.env.MAILER_EMAIL,
        to: process.env.MAILER_EMAIL,
        subject: "RMA request",
        html: `
        <div>
          <p>
            Account Name: ${process.env.CARDINAL_ACCOUNT_NAME}
            <br/>
            Account Number: ${process.env.CARDINAL_ACCOUNT_NUMBER}
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
          <p>Please create MRA for the following item(s).</p>
          <br/>
        ${generateHtmlTable(results)}
        </div>
        `,
      },
      (err, info) => {
        if (err) {
          console.error(err);
        }
      }
    );
  } catch (e) {
    console.log(e);
  }
};

/**
 * @param {[ReturnItem]} items
 */
const generateHtmlTable = (items) => {
  return `
              <div>
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Invoice #</th>
                      <th>CIN/NDC</th>
                      <th>GTIN</th>
                      <th>Serial #</th>
                      <th>Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${items
                      .map(
                        (v, i) => `
                    <tr>
                      <td>${(i + 1).toString()}</td>
                      <td>${v.invoiceRef || ""}</td>
                      <td>${v.cin || v.ndc}</td>
                      <td>${v.gtin}</td>
                      <td>${v.sn}</td>
                      <td>Overstock</td>
                    </tr>
                    `
                      )
                      .join("")}
                  </tbody>
                </table>
              </div>
              `;
};
