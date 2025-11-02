const {
  init,
  emitAll,
  findEx,
  createPickup,
  searchPickups,
  generateReport,
  path,
} = require("../../services/apps/pickup");

exports.post = async (req, res) => {
  const pickup = req.app.get("io").of("/pickup");
  const canvas = req.app.get("apps_pickup_canvas");
  const items = req.app.get("apps_pickup_items");
  const relation = req.app.get("apps_pickup_relation");
  const date = new Date();
  const _date = req.app.get("apps_pickup_date");
  const deliveryDate = _date || date;
  try {
    if (items.length === 0 || !canvas) {
      throw new Error();
    }
    const { notes } = req.body;
    const exDoc = await findEx(items, deliveryDate);
    if (exDoc.length > 0) {
      pickup.emit("state", "error");
      req.app.set("apps_pickup_state", "standby");
      const table = {};
      items.forEach((v) => (table[v] = false));
      const intersection = [];
      exDoc.forEach((v) => {
        v.rxNumber.forEach((w) => table[w] === false && (table[w] = true));
      });
      for (const key in table) {
        if (table[key]) {
          intersection.push(key);
        }
      }
      return res.status(409).send({
        code: 409,
        message: `Following item(s) are already recorded as delivered: ${intersection.join(
          ", "
        )}`,
      });
    }
    await createPickup(
      {
        rxNumber: items,
        relation,
        date,
        notes,
        deliveryDate,
      },
      canvas.replace(/^data:image\/png;base64,/, "")
    );
    init(req.app);
    emitAll(pickup, req.app);
    return res
      .status(200)
      .send({ code: 200, message: "A pickup log was successfully saved." });
  } catch (e) {
    console.error(e);
    pickup.emit("state", "error");
    req.app.set("apps_pickup_state", "standby");
    return res.status(500).send({
      code: 500,
      message: "Internal Server Error",
    });
  }
};

exports.search = async (req, res, next) => {
  try {
    const { rxNumber, date } = req.query;
    if (!(rxNumber || date)) {
      return res.status(400).send({ code: 400, message: "Bad Request" });
    }
    const data = await searchPickups(rxNumber, date);
    if (data.length === 0) {
      return res.status(404).send({ code: 404, message: "Not Found" });
    }
    return res.status(200).send({ code: 200, data });
  } catch (e) {
    console.error(e);
    next(e);
  }
};

exports.png = (req, res, next) => {
  try {
    res.sendFile(path + `/${req.params._id}.png`);
  } catch (e) {
    console.error(e);
    next(e);
  }
};

exports.report = async (req, res, next) => {
  try {
    const { _id, rxNumber } = req.params;
    if (!_id) {
      return res.status(400).send({ code: 400, message: "Bad Request" });
    }
    const data = await generateReport(_id, rxNumber);
    if (!data) {
      return res.status(404).send({ code: 404, message: "Not Found" });
    }
    res.status(200).send({ code: 200, data });
  } catch (e) {
    console.log(e);
    next(e);
  }
};
