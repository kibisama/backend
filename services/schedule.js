const { scheduleUpsert } = require("./cah/upsertItemsViaDSCSA");
const { scheduleUpdateSources } = require("./inv/dailyOrder");
const { createPreset } = require("./apps/settings");

module.exports = () => {
  scheduleUpsert();
  scheduleUpdateSources();
  createPreset();
};
