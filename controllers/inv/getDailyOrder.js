const dailyOrder = require("../../services/inv/dailyOrder");

module.exports = async (req, res, next) => {
  try {
    const dailyOrders = await dailyOrder.findDOByDateString(req.params.date);
    if (dailyOrders.length > 0) {
      const results = [];
      for (let i = 0; i < dailyOrders.length; i++) {
        if (dailyOrders[i].status !== "FILLED") {
          results.push(dailyOrders[i].data);
        } else {
          results.push(
            dailyOrder.generateData(await dailyOrder.populateDO(dailyOrders[i]))
          );
        }
      }
      return res.send({ results });
    }
    return res.send({ results: dailyOrders });
  } catch (e) {
    console.log(e);
  }
};
