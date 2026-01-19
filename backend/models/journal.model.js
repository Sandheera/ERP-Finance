const mongoose = require("mongoose");

const journalSchema = new mongoose.Schema(
  {
    description: String,
    lines: [
      {
        account: String,
        debit: Number,
        credit: Number
      }
    ]
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Journal ||
  mongoose.model("Journal", journalSchema);
