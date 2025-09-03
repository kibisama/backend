const { scheduleUpsert } = require("./cah/upsertItemsViaDSCSA");
const { scheduleUpdateSources } = require("./inv/dailyOrder");
const { scheduleMailer: scheduleReturns } = require("./cah/returnRequest");
const { createPreset: createSettingPreset } = require("./apps/settings");
const { createPreset: createDeliveryGroupPreset } = require("./apps/delivery");

module.exports = () => {
  // scheduleUpsert();
  // scheduleUpdateSources();
  // createSettingPreset();
  // createDeliveryGroupPreset();
  // scheduleReturns();
};
