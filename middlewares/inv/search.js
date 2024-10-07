const Item = require("../../schemas/item");
const dayjs = require("dayjs");
// const createInvTable = require("../../services/createInvTable");

const search = async (req, res, next) => {
  let _result;
  if (Object.keys(req.body).length === 0) {
    const startOfToday = dayjs().startOf("d");
    const endOfToday = dayjs().endOf("d");
    _result = await Item.find({
      $or: [
        { dateFilled: { $gte: startOfToday, $lte: endOfToday } },
        { dateFilled: undefined },
      ],
    });
  }
  // 여기서는 필터 객체를 추가해서 쓸데없이 객체수정하는일없이 바로보내도록하자
  // const result = createInvTable(_result);
  // res.send(result);
};

module.exports = search;
