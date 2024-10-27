const mongoose = require("mongoose");
const { Schema } = mongoose;

const cardinalDailyOrderSchema = new Schema({
  date: Date,
});

module.exports = mongoose.model(
  "Cardinal Daily Order",
  cardinalDailyOrderSchema
);
