const express = require("express");
const router = express.Router();
const JournalEntry = require("../models/journal.model");
const Invoice = require("../models/invoice.model");

// ==================== CREATE MANUAL JOURNAL ENTRY ====================
router.post("/", async (req, res) => {
  try {
    const { account, debit, credit, period, description } = req.body;

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

    // Create manual journal entry (without invoiceId)
    const entry = new JournalEntry({
      account: account.trim(),
      debit: debit || 0,
      credit: credit || 0,
      period,
      description: description || "Manual entry"
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

// ==================== GET ENTRIES BY INVOICE ====================
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

// ==================== DELETE JOURNAL ENTRY ====================
// Note: Usually journal entries should not be deleted after posting
// This is for manual entries or corrections only
router.delete("/:id", async (req, res) => {
  try {
    const entry = await JournalEntry.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({ error: "Journal entry not found" });
    }

    // Check if it's linked to an invoice
    if (entry.invoiceId) {
      return res.status(403).json({
        error: "Cannot delete journal entry linked to an invoice. Reverse the invoice approval instead."
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

// ==================== GET ACCOUNT BALANCE ====================
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

module.exports = router;