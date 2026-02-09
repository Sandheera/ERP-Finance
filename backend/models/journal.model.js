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
    ],
    period: {
      type: String,
      match: /^\d{4}-\d{2}$/
    },
    account: String,
    debit: Number,
    credit: Number,
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice"
    },
    status: {
      type: String,
      enum: ["DRAFT", "SUBMITTED", "APPROVED", "POSTED"],
      default: "DRAFT",
      index: true
    },
    submittedBy: String,
    submittedAt: Date,
    approvedBy: String,
    approvedAt: Date,
    attachments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DocumentAttachment"
      }
    ],
    comments: String,
    reviewerComments: String
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Journal ||
  mongoose.model("Journal", journalSchema);
