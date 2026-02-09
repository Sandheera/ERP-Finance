const mongoose = require("mongoose");

const bankReconciliationSchema = new mongoose.Schema(
  {
    period: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}$/,
      index: true
    },
    bankStatement: {
      date: Date,
      balance: {
        type: Number,
        required: true
      },
      fileName: String,
      uploadedAt: Date
    },
    bookBalance: {
      type: Number,
      required: true
    },
    discrepancies: [
      {
        type: {
          type: String,
          enum: ["OUTSTANDING_CHECK", "UNDEPOSITED_FUNDS", "BANK_CHARGE", "INTEREST", "ERROR"],
          required: true
        },
        description: String,
        amount: Number,
        journalEntryId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Journal"
        },
        resolvedAt: Date
      }
    ],
    status: {
      type: String,
      enum: ["DRAFT", "SUBMITTED", "APPROVED", "CLOSED"],
      default: "DRAFT",
      index: true
    },
    submittedBy: String,
    submittedAt: Date,
    approvedBy: String,
    approvedAt: Date,
    attachments: [
      {
        fileName: String,
        fileType: String,
        fileSize: Number,
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User"
        },
        uploadedAt: {
          type: Date,
          default: Date.now
        },
        filePath: String
      }
    ],
    comments: String,
    reconciliationNotes: String
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.BankReconciliation ||
  mongoose.model("BankReconciliation", bankReconciliationSchema);
