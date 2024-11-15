const { scheduleJob } = require("node-schedule");
const dayjs = require("dayjs");
const CardinalItem = require("../../schemas/cardinal/cardinalItem");
const puppet = require("../../api/puppet");
const updateDailyOrder = require("../inventory/updateDailyOrder");

// want to change name to updateProduct
module.exports = async function updateItem(ndc11, dailyOrder) {
  let count = 0;
  const maxCount = 4;
  async function update() {
    try {
      const now = dayjs();
      console.log(
        `Updating Caridnal Item ${
          ndc11 + " " + now.format("MM/DD/YY HH:mm:ss")
        }...`
      );
      const result = await puppet.cardinal.updateItem(ndc11);
      if (result instanceof Error) {
        switch (result.status) {
          // case 404:
          //   return;
          case 500:
            if (count > maxCount) {
              return;
            }
            count++;
            scheduleJob(now.add(30, "minute").toDate(), update);
            break;
          case 503:
            scheduleJob(now.add(3, "minute").toDate(), update);
            break;
          default:
        }
      } else {
        const productDetails = result.data.results.productDetails;
        productDetails.lastUpdated = dayjs();
        productDetails.retailPriceChanged = dayjs(
          productDetails.retailPriceChanged
        );
        productDetails.altNetCost = productDetails.histInvoiceDate.map(
          (v) => "$" + v
        );
        productDetails.histInvoiceDate = productDetails.histInvoiceDate.map(
          (v) => dayjs(v)
        );
        return await CardinalItem.findOneAndUpdate(
          { ndc: ndc11 },
          { ...productDetails },
          { new: true, upsert: true }
        );
      }
      return result;
    } catch (e) {
      return e;
    }
  }
  try {
    const result = await update();
    if (dailyOrder && result && !result instanceof Error) {
      await updateDailyOrder(dailyOrder, ndc11);
    }
    return result;
  } catch (e) {
    return e;
  }
};
