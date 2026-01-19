const express = require("express");
const router = express.Router();
const JournalEntry = require("../models/journal.model");
const Invoice = require("../models/invoice.model");
const journalService = require("../services/journal.service");
const DocumentAttachment = require("../models/DocumentAttachment");

// ==================== ACCOUNTANT ROUTES (SPECIFIC PATHS - MUST BE FIRST) ====================

// GET DRAFT ENTRIES
router.get("/accountant/drafts", async (req, res) => {
  try {
    const { period } = req.query;
    const userId = req.headers["user-id"] || "accountant-001";

    const filter = { status: "DRAFT" };
    if (period) filter.period = period;

    const entries = await JournalEntry.find(filter)
      .populate("attachments")
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      count: entries.length,
      entries: entries
    });
  } catch (error) {
    console.error("Get Draft Entries Error:", error);
    res.status(500).json({
      error: "Failed to fetch draft entries",
      details: error.message
    });
  }
});

// GET SUBMITTED ENTRIES
router.get("/accountant/submitted", async (req, res) => {
  try {
    const { period } = req.query;

    const filter = { status: "SUBMITTED" };
    if (period) filter.period = period;

    const entries = await JournalEntry.find(filter)
      .populate("attachments")
      .sort({ submittedAt: -1 })
      .lean();

    res.json({
      count: entries.length,
      entries: entries
    });
  } catch (error) {
    console.error("Get Submitted Entries Error:", error);
    res.status(500).json({
      error: "Failed to fetch submitted entries",
      details: error.message
    });
  }
});

// ==================== OTHER SPECIFIC ROUTES ====================

// SUBMIT JOURNAL ENTRY
router.post("/:id/submit", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers["user-id"] || "accountant-001";

    const entry = await JournalEntry.findById(id);
    if (!entry) {
      return res.status(404).json({ error: "Journal entry not found" });
    }

    if (entry.status !== "DRAFT") {
      return res.status(400).json({ error: "Only draft entries can be submitted" });
    }

    entry.status = "SUBMITTED";
    entry.submittedBy = userId;
    entry.submittedAt = new Date();
    await entry.save();

    res.json({
      message: "Entry submitted for approval",
      entry
    });
  } catch (error) {
    console.error("Submit Journal Entry Error:", error);
    res.status(500).json({
      error: "Failed to submit journal entry",
      details: error.message
    });
  }
});

// ATTACH DOCUMENT
router.post("/:id/attach", async (req, res) => {
  try {
    const { id } = req.params;
    const { fileName, fileType, fileSize, description, category } = req.body;
    const userId = req.headers["user-id"] || "accountant-001";

    if (!fileName || !fileType) {
      return res.status(400).json({ error: "fileName and fileType are required" });
    }

    const attachment = new DocumentAttachment({
      referenceType: "JOURNAL_ENTRY",
      referenceId: id,
      fileName,
      fileType,
      fileSize: fileSize || 0,
      filePath: `/uploads/${id}/${fileName}`,
      uploadedBy: userId,
      description: description || "",
      category: category || "OTHER"
    });

    await attachment.save();

    const entry = await JournalEntry.findById(id);
    if (entry) {
      if (!entry.attachments) entry.attachments = [];
      entry.attachments.push(attachment._id);
      await entry.save();
    }

    res.status(201).json({
      message: "Document attached successfully",
      attachment,
      entry
    });
  } catch (error) {
    console.error("Attach Document Error:", error);
    res.status(500).json({
      error: "Failed to attach document",
      details: error.message
    });
  }
});

// GET WITH ATTACHMENTS
router.get("/:id/with-attachments", async (req, res) => {
  try {
    const entry = await JournalEntry.findById(req.params.id)
      .populate("attachments");

    if (!entry) {
      return res.status(404).json({ error: "Journal entry not found" });
    }

    res.json(entry);
  } catch (error) {
    console.error("Get Journal Entry Error:", error);
    res.status(500).json({
      error: "Failed to fetch journal entry",
      details: error.message
    });
  }
});

// GET BY INVOICE
router.get("/invoice/:invoiceId", async (req, res) => {
  try {
    const entries = await JournalEntry.find({ 
      invoiceId: req.params.invoiceId 
    })
      .sort({ createdAt: 1 })
      .lean();

    if (entries.length === 0) {
      return res.status(404).json({
        error: "No journal entries found for this invoice"
      });
    }

    res.json({
      count: entries.length,
      entries
    });
  } catch (error) {
    console.error("Get Entries by Invoice Error:", error);
    res.status(500).json({
      error: "Failed to fetch journal entries",
      details: error.message
    });
  }
});

// GET ACCOUNT BALANCE
router.get("/account/:accountName/balance", async (req, res) => {
  try {
    const { accountName } = req.params;
    const { period } = req.query;

    const filter = { account: accountName };
    if (period) filter.period = period;

    const result = await JournalEntry.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalDebit: { $sum: "$debit" },
          totalCredit: { $sum: "$credit" }
        }
      }
    ]);

    const balance = result.length > 0
      ? result[0].totalDebit - result[0].totalCredit
      : 0;

    res.json({
      account: accountName,
      period: period || "All periods",
      balance,
      debit: result[0]?.totalDebit || 0,
      credit: result[0]?.totalCredit || 0
    });
  } catch (error) {
    console.error("Get Account Balance Error:", error);
    res.status(500).json({
      error: "Failed to get account balance",
      details: error.message
    });
  }
});

// ==================== CREATE MANUAL JOURNAL ENTRY ====================
router.post("/", async (req, res) => {
  try {
    const { account, debit, credit, period, description, comments } = req.body;
    const userId = req.headers["user-id"] || "accountant-001";

    // Validation
    if (!account || !period) {
      return res.status(400).json({
        error: "Missing required fields: account, period"
      });
    }

    if (!/^\d{4}-\d{2}$/.test(period)) {
      return res.status(400).json({
        error: "Invalid period format. Use YYYY-MM"
      });
    }

    if ((debit || 0) === 0 && (credit || 0) === 0) {
      return res.status(400).json({
        error: "Either debit or credit must be greater than 0"
      });
    }

    // Create manual journal entry
    const entry = new JournalEntry({
      account: account.trim(),
      debit: debit || 0,
      credit: credit || 0,
      period,
      description: description || "Manual entry",
      comments: comments || "",
      status: "DRAFT",
      submittedBy: userId
    });

    await entry.save();

    res.status(201).json({
      message: "Journal entry created successfully",
      entry
    });
  } catch (error) {
    console.error("Create Journal Entry Error:", error);
    res.status(500).json({
      error: "Failed to create journal entry",
      details: error.message
    });
  }
});

// ==================== GET ALL JOURNAL ENTRIES ====================
router.get("/", async (req, res) => {
  try {
    const { period, account } = req.query;

    // Build filter
    const filter = {};
    if (period) filter.period = period;
    if (account) filter.account = { $regex: account, $options: "i" };

    const entries = await JournalEntry.find(filter)
      .populate("invoiceId", "type partner amount status")
      .sort({ createdAt: -1 })
      .lean();

    res.json(entries);
  } catch (error) {
    console.error("Get Journal Entries Error:", error);
    res.status(500).json({
      error: "Failed to fetch journal entries",
      details: error.message
    });
  }
});

// ==================== UPDATE DRAFT ENTRY ====================
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const entry = await JournalEntry.findById(id);

    if (!entry) {
      return res.status(404).json({ error: "Journal entry not found" });
    }

    if (entry.status !== "DRAFT") {
      return res.status(400).json({ error: "Only draft entries can be updated" });
    }

    // Update fields
    if (req.body.description) entry.description = req.body.description;
    if (req.body.account) entry.account = req.body.account;
    if (req.body.debit !== undefined) entry.debit = req.body.debit;
    if (req.body.credit !== undefined) entry.credit = req.body.credit;
    if (req.body.period) entry.period = req.body.period;
    if (req.body.comments) entry.comments = req.body.comments;

    await entry.save();

    res.json({
      message: "Journal entry updated successfully",
      entry
    });
  } catch (error) {
    console.error("Update Journal Entry Error:", error);
    res.status(500).json({
      error: "Failed to update journal entry",
      details: error.message
    });
  }
});

// ==================== DELETE DRAFT JOURNAL ENTRY ====================
router.delete("/:id", async (req, res) => {
  try {
    const entry = await JournalEntry.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({ error: "Journal entry not found" });
    }

    if (entry.status !== "DRAFT") {
      return res.status(400).json({ error: "Only draft entries can be deleted" });
    }

    if (entry.invoiceId) {
      return res.status(403).json({
        error: "Cannot delete journal entry linked to an invoice."
      });
    }

    await JournalEntry.findByIdAndDelete(req.params.id);

    res.json({
      message: "Journal entry deleted successfully",
      deletedId: req.params.id
    });
  } catch (error) {
    console.error("Delete Journal Entry Error:", error);
    res.status(500).json({
      error: "Failed to delete journal entry",
      details: error.message
    });
  }
});

// ==================== GET SINGLE JOURNAL ENTRY ====================
router.get("/:id", async (req, res) => {
  try {
    const entry = await JournalEntry.findById(req.params.id)
      .populate("invoiceId");

    if (!entry) {
      return res.status(404).json({ error: "Journal entry not found" });
    }

    res.json(entry);
  } catch (error) {
    console.error("Get Journal Entry Error:", error);
    
    if (error.name === "CastError") {
      return res.status(400).json({ error: "Invalid journal entry ID format" });
    }

    res.status(500).json({
      error: "Failed to fetch journal entry",
      details: error.message
    });
  }
});

module.exports = router;