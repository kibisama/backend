const { scheduleUpsert } = require("./cah/upsertItemsViaDSCSA");
const { scheduleUpdateSources } = require("./inv/dailyOrder");

module.exports = () => {
  scheduleUpsert();
  scheduleUpdateSources();
};
