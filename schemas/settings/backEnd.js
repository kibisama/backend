const mongoose = require("mongoose");
const { Schema } = mongoose;

const backEndSchema = new Schema({});

module.exports = mongoose.model("BackEnd Setting", backEndSchema);
