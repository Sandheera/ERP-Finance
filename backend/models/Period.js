const mongoose = require("mongoose");

module.exports = mongoose.model("Period", new mongoose.Schema({
  month: String,
  closed: Boolean
}));
