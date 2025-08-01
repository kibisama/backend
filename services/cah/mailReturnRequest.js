const dayjs = require("dayjs");
const { scheduleJob } = require("node-schedule");
const item = require("../inv/item");
const Package = require("../../schemas/package");

/**
 * @typedef {object} ReturnItem
 * @property {string} gtin
 * @property {string} sn
 * @property {string} [invoiceRef]
 * @property {string} [cost]
 * @property {string} [cin]
 * @property {string} [ndc]
 */

/**
 * @returns {[item.Item]}
 */
const findReturnedItems = async () => {
  try {
    return await item.findReturnedItems(dayjs(), "CARDINAL");
  } catch (e) {
    console.log;
  }
};

/**
 *
 */

/**
 * WARN IF PASSED 180 DAYS, REJECTS IF PASSED 360 DAYS & EXPORT TO CONTROLLER
 */

/**
 * @param {[ReturnItem]} items
 */
const generateHtmlTable = (items) => {
  return `
              <div>
                <table>
                  <thead>
                    <tr>
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
                        (v) => `
                    <tr>
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
