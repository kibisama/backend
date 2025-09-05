const {
  scheduleUpsert: scheduleUpsertCAHItems,
} = require("./cah/upsertItemsViaDSCSA");
// const { scheduleUpdateSources } = require("./inv/dailyOrder");
// const { scheduleMailer: scheduleReturns } = require("./cah/returnRequest");
// const { createPreset: createDeliveryGroupPreset } = require("./apps/delivery");

module.exports = () => {
  scheduleUpsertCAHItems();
  // scheduleUpdateSources();
  // createDeliveryGroupPreset();
  // scheduleReturns();
};
