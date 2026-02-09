const express = require("express");
const router = express.Router();

const Invoice = require("../models/invoice.model");
const JournalEntry = require("../models/journal.model");

// ==================== GET PENDING JOURNAL ENTRIES FOR APPROVAL ====================
router.get("/journal/pending", async (req, res) => {
  try {
    const { period } = req.query;
    
    const filter = { status: "SUBMITTED" };
    if (period) filter.period = period;
    
    const entries = await JournalEntry.find(filter)
      .populate("submittedBy", "username email")
      .populate("attachments")
      .sort({ submittedAt: -1 })
      .lean();
    
    res.json({
      count: entries.length,
      entries: entries
    });
  } catch (error) {
    console.error("Get Pending Entries Error:", error);
    res.status(500).json({
      error: "Failed to fetch pending entries",
      details: error.message
    });
  }
});

// ==================== APPROVE JOURNAL ENTRY ====================
router.post("/journal/:id/approve", async (req, res) => {
  try {
    const { id } = req.params;
    const { reviewerComments } = req.body;
    const managerId = req.headers["user-id"];
    
    if (!managerId) {
      return res.status(401).json({ error: "User ID required" });
    }
    
    const entry = await JournalEntry.findById(id);
    
    if (!entry) {
      return res.status(404).json({ error: "Journal entry not found" });
    }
    
    if (entry.status !== "SUBMITTED") {
      return res.status(400).json({ 
        error: "Only SUBMITTED entries can be approved" 
      });
    }
    
    // Update entry with approval info
    entry.status = "APPROVED";
    entry.approvedBy = managerId;
    entry.approvedAt = new Date();
    if (reviewerComments) {
      entry.reviewerComments = reviewerComments;
    }
    
    await entry.save();
    
    res.json({
      message: "Journal entry approved successfully",
      entry: entry
    });
  } catch (error) {
    console.error("Approve Journal Entry Error:", error);
    res.status(500).json({
      error: "Failed to approve journal entry",
      details: error.message
    });
  }
});

// ==================== REJECT JOURNAL ENTRY ====================
router.post("/journal/:id/reject", async (req, res) => {
  try {
    const { id } = req.params;
    const { reviewerComments } = req.body;
    const managerId = req.headers["user-id"];
    
    if (!managerId) {
      return res.status(401).json({ error: "User ID required" });
    }
    
    if (!reviewerComments) {
      return res.status(400).json({ 
        error: "Rejection reason is required" 
      });
    }
    
    const entry = await JournalEntry.findById(id);
    
    if (!entry) {
      return res.status(404).json({ error: "Journal entry not found" });
    }
    
    if (entry.status !== "SUBMITTED") {
      return res.status(400).json({ 
        error: "Only SUBMITTED entries can be rejected" 
      });
    }
    
    // Return to draft status with rejection reason
    entry.status = "DRAFT";
    entry.reviewerComments = reviewerComments;
    entry.submittedAt = null;
    entry.submittedBy = null;
    
    await entry.save();
    
    res.json({
      message: "Journal entry rejected and returned to draft",
      entry: entry
    });
  } catch (error) {
    console.error("Reject Journal Entry Error:", error);
    res.status(500).json({
      error: "Failed to reject journal entry",
      details: error.message
    });
  }
});

// ==================== GET APPROVAL STATISTICS ====================
router.get("/statistics", async (req, res) => {
  try {
    const { period } = req.query;
    
    // Build filter for period if provided
    const filter = period ? { period } : {};
    
    // Get counts by status
    const submitted = await JournalEntry.countDocuments({ status: "SUBMITTED", ...filter });
    const approved = await JournalEntry.countDocuments({ status: "APPROVED", ...filter });
    const posted = await JournalEntry.countDocuments({ status: "POSTED", ...filter });
    const draft = await JournalEntry.countDocuments({ status: "DRAFT", ...filter });
    
    // Get pending invoices
    const pendingInvoices = await Invoice.countDocuments({ status: "PENDING" });
    const approvedInvoices = await Invoice.countDocuments({ status: "APPROVED" });
    
    // Get pending amounts
    const pendingEntries = await JournalEntry.find({ status: "SUBMITTED", ...filter });
    const pendingAmount = pendingEntries.reduce((sum, entry) => {
      return sum + (entry.debit || 0) + (entry.credit || 0);
    }, 0);
    
    // Calculate approval rate
    const totalEntries = submitted + approved + posted + draft;
    const approvalRate = totalEntries > 0 ? Math.round((approved / totalEntries) * 100) : 0;
    
    res.json({
      journalEntries: {
        submitted,
        approved,
        posted,
        draft,
        total: totalEntries
      },
      invoices: {
        pending: pendingInvoices,
        approved: approvedInvoices
      },
      metrics: {
        pendingAmount,
        approvalRate,
        pendingApprovals: submitted
      }
    });
  } catch (error) {
    console.error("Get Statistics Error:", error);
    res.status(500).json({
      error: "Failed to fetch statistics",
      details: error.message
    });
  }
});

// APPROVE INVOICE
router.post("/:id/approve", async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    if (invoice.status === "APPROVED") {
      return res.status(400).json({ error: "Invoice already approved" });
    }

    // Update status
    invoice.status = "APPROVED";
    await invoice.save();

    // Auto-generate journal entry
    await JournalEntry.create({
      description: invoice.type === "AR" ? "Customer Invoice" : "Vendor Bill",
      lines:
        invoice.type === "AR"
          ? [
              { account: "1100", debit: invoice.amount, credit: 0 },
              { account: "4000", debit: 0, credit: invoice.amount }
            ]
          : [
              { account: "5000", debit: invoice.amount, credit: 0 },
              { account: "2100", debit: 0, credit: invoice.amount }
            ]
    });

    res.json({ message: "Invoice approved & journal posted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
