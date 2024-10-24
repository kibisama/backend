const { scheduleJob } = require("node-schedule");
const dayjs = require("dayjs");
const CardinalInvoice = require("../../schemas/cardinal/cardinalInvoice");
const puppet = require("../../api/puppet");
const createInvoice = require("./createInvoice");

module.exports = async function checkInvoice() {
  console.log(`Checking Caridnal Invoice ...`);
  const today = dayjs().set("hour", 7).set("minute", 0).set("second", 0);
  const tomorrow = today.add(1, "d");
  const yesterday = today.subtract(1, "d");
  const dayYesterday = yesterday.day();
  if (dayYesterday > 4) {
    scheduleJob(tomorrow.toDate(), checkInvoice);
  }
  try {
    const invoices = await CardinalInvoice.find({
      invoiceDate: { $gt: yesterday, $lt: tomorrow },
    });
    if (invoices.length > 0) {
      scheduleJob(tomorrow.toDate(), checkInvoice);
      return;
    }
    const result = await puppet.cardinal.getInvoice({
      date: today.format("MM/DD/YYYY"),
    });
    if (result) {
      const { invoiceDetails } = result.data.results;
      for (let i = 0; i < invoiceDetails.length; i++) {
        await createInvoice(invoiceDetails[i]);
      }
    } else {
      const oneHourLater = dayjs().add(1, "hour");
      scheduleJob(oneHourLater.toDate(), checkInvoice);
      return;
    }
    scheduleJob(tomorrow.toDate(), checkInvoice);
  } catch (e) {
    console.log(e);
  }
};
