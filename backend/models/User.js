const mongoose = require("mongoose");

module.exports = mongoose.model("User", new mongoose.Schema({
  username: String,
  role: { type: String, enum: ["ACCOUNTANT", "MANAGER"] }
}));
