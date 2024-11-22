const mongoose = require("mongoose");
const { Schema } = mongoose;

const frontEndSchema = new Schema({
  darkMode: Boolean,
});

module.exports = mongoose.model("FrontEnd Setting", frontEndSchema);
