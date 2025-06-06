const dailyOrder = require("../../services/inv/dailyOrder");

module.exports = async (req, res, next) => {
  try {
    const dailyOrders = await dailyOrder.findDOByDateString(req.params.date);
    if (dailyOrders.length > 0) {
      const results = [];
      for (let i = 0; i < dailyOrders.length; i++) {
        const dO = dailyOrders[i];
        if (dO.status !== "FILLED") {
          results.push(dO.data);
        } else {
          results.push(
            dailyOrder.generateData(await dailyOrder.populateDO(dO))
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
