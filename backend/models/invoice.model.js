const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["AR", "AP"], required: true },
    partner: String,
    amount: Number,
    status: {
      type: String,
      enum: ["PENDING_APPROVAL", "APPROVED"],
      default: "PENDING_APPROVAL"
    }
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Invoice ||
  mongoose.model("Invoice", invoiceSchema);
