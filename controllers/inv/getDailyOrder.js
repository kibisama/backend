const dailyOrder = require("../../services/inv/dailyOrder");

module.exports = async (req, res, next) => {
  try {
    const dailyOrders = await dailyOrder.findDOByDateString(req.params.date);
    if (dailyOrders.length > 0) {
      const populatedDOs = [];
      for (let i = 0; i < dailyOrders.length; i++) {
        const popDO = await dailyOrder.populateDO(dailyOrders[i]);
        populatedDOs.push(popDO);
      }
      const results = [];
      for (let i = 0; i < populatedDOs.length; i++) {
        results[i] = dailyOrder.generateData(populatedDOs[i]);
        await dailyOrder.getAllInStock(results[i], populatedDOs[i].package);
      }
      return res.send({ results });
    }
    return res.send({ results: dailyOrders });
  } catch (e) {
    console.log(e);
  }
};
