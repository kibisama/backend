const { scheduleUpsert } = require("./cah/upsertItemsViaDSCSA");
const { scheduleUpdateSources } = require("./inv/dailyOrder");
const { scheduleMailer: scheduleReturns } = require("./cah/returnRequest");
const { createPreset: createSetting } = require("./apps/settings");
const { createPreset: createFacilityGroup } = require("./apps/facilityGroup");

module.exports = () => {
  scheduleUpsert();
  scheduleUpdateSources();
  createSetting();
  createFacilityGroup();
  scheduleReturns();
};
