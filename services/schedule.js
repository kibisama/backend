const { scheduleUpsert } = require("./cah/upsertItemsViaDSCSA");
const { scheduleUpdateSources } = require("./inv/dailyOrder");
const { createPreset: createSetting } = require("./apps/settings");
const { createPreset: createFacilityGroup } = require("./apps/facilityGroup");

module.exports = () => {
  scheduleUpsert();
  scheduleUpdateSources();
  /** CREATES PRESET DATA SETS IF NOT EXISTS */
  createSetting();
  createFacilityGroup();
};
