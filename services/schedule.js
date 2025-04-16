const { scheduleUpsert } = require("./cah/UpsertItemsViaDSCSA");
const { scheduleUpdateSources } = require("./inv/dailyOrder");

module.exports = () => {
  scheduleUpsert();
  scheduleUpdateSources();
};
