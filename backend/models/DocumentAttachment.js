const mongoose = require("mongoose");

const documentAttachmentSchema = new mongoose.Schema(
  {
    referenceType: {
      type: String,
      enum: ["JOURNAL_ENTRY", "BANK_RECONCILIATION", "INVOICE", "EXPENSE"],
      required: true,
      index: true
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },
    fileName: {
      type: String,
      required: true
    },
    fileType: {
      type: String,
      enum: ["PDF", "JPG", "PNG", "XLSX", "XLS", "DOC", "DOCX", "TXT", "CSV"],
      required: true
    },
    fileSize: Number,
    filePath: {
      type: String,
      required: true
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    description: String,
    category: {
      type: String,
      enum: ["RECEIPT", "INVOICE", "BANK_STATEMENT", "APPROVAL", "EVIDENCE", "OTHER"],
      default: "OTHER"
    }
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.DocumentAttachment ||
  mongoose.model("DocumentAttachment", documentAttachmentSchema);
