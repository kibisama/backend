const { scheduleJob } = require("node-schedule");
const dayjs = require("dayjs");
const CardinalInvoice = require("../../schemas/cardinal/cardinalInvoice");
const puppet = require("../../api/puppet");
const createInvoice = require("./createInvoice");

module.exports = async function checkInvoice() {
  const now = dayjs();
  try {
    const dayToday = now.day();
    const tomorrow = now
      .add(1, "d")
      .set("hour", 8)
      .set("minute", 0)
      .set("second", 0);
    if (dayToday === 0) {
      return scheduleJob(tomorrow.toDate(), checkInvoice);
    }
    console.log(
      `Checking Caridnal Invoice ${now.format("MM/DD/YY HH:mm:ss")}...`
    );
    const todayStart = dayjs(now).startOf("date");
    const todayEnd = dayjs(now).endOf("date");
    const invoices = await CardinalInvoice.find({
      invoiceDate: { $gte: todayStart, $lte: todayEnd },
    });
    if (invoices.length > 0) {
      return scheduleJob(tomorrow, checkInvoice);
    }
    const result = await puppet.cardinal.getInvoice({
      //testing
      date: today.format("10/24/2024"),
      // date: now.format("MM/DD/YYYY"),
    });
    if (result) {
      const { invoiceDetails } = result.data.results;
      if (invoiceDetails.length > 0) {
        for (const invoiceDetail in invoiceDetails) {
          await createInvoice(invoiceDetail);
        }
      }
    } else {
      const thirtyMinsLater = now.add(30, "minute");
      return scheduleJob(thirtyMinsLater.toDate(), checkInvoice);
    }
    return scheduleJob(tomorrow.toDate(), checkInvoice);
  } catch (e) {
    console.log(e);
  }
};
