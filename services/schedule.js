const {
  scheduleUpsert: scheduleUpsertCAHItems,
} = require("./cah/upsertItemsViaDSCSA");
const {
  scheduleRequest: scheduleRequestCAHReturns,
} = require("./cah/returnRequest");

// schedule re-request puppets

module.exports = () => {
  scheduleUpsertCAHItems();
  scheduleRequestCAHReturns();
};
