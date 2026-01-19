const mongoose = require("mongoose");

const closingSchema = new mongoose.Schema(
  {
    period: { type: String, unique: true },
    status: { type: String, default: "OPEN" }
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.PeriodClosing ||
  mongoose.model("PeriodClosing", closingSchema);
