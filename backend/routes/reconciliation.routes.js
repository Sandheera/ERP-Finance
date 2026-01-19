const express = require("express");
const router = express.Router();
const BankReconciliation = require("../models/BankReconciliation");
const reconciliationService = require("../services/reconciliation.service");
const DocumentAttachment = require("../models/DocumentAttachment");

// ==================== SPECIFIC ROUTES (defined before generic :id routes) ====================

// ==================== GET ALL DRAFT RECONCILIATIONS ====================
router.get("/drafts/list", async (req, res) => {
  try {
    const result = await reconciliationService.getDraftReconciliations();

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({
      count: result.reconciliations.length,
      reconciliations: result.reconciliations
    });
  } catch (error) {
    console.error("Get Draft Reconciliations Error:", error);
    res.status(500).json({
      error: "Failed to fetch draft reconciliations",
      details: error.message
    });
  }
});

// ==================== GET RECONCILIATION BY PERIOD ====================
router.get("/period/:period", async (req, res) => {
  try {
    const { period } = req.params;

    if (!/^\d{4}-\d{2}$/.test(period)) {
      return res.status(400).json({
        error: "Invalid period format. Use YYYY-MM"
      });
    }

    const result = await reconciliationService.getReconciliation(period);

    if (!result.success) {
      return res.status(404).json({ error: result.error });
    }

    res.json(result.reconciliation);
  } catch (error) {
    console.error("Get Reconciliation Error:", error);
    res.status(500).json({
      error: "Failed to fetch reconciliation",
      details: error.message
    });
  }
});

// ==================== GENERIC ROUTES (must be after specific routes) ====================

// ==================== CREATE BANK RECONCILIATION ====================
router.post("/", async (req, res) => {
  try {
    const { period, bankBalance, bankDate, bankFileName, bookBalance, notes } = req.body;
    const userId = req.headers["user-id"];

    if (!userId) {
      return res.status(401).json({ error: "User ID required" });
    }

    if (!period || bankBalance === undefined || bookBalance === undefined) {
      return res.status(400).json({
        error: "Missing required fields: period, bankBalance, bookBalance"
      });
    }

    if (!/^\d{4}-\d{2}$/.test(period)) {
      return res.status(400).json({
        error: "Invalid period format. Use YYYY-MM"
      });
    }

    const result = await reconciliationService.createReconciliation(
      {
        period,
        bankBalance,
        bankDate: bankDate || new Date(),
        bankFileName: bankFileName || "Bank Statement",
        bookBalance,
        notes
      },
      userId
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.status(201).json({
      message: "Bank reconciliation created",
      reconciliation: result.reconciliation
    });
  } catch (error) {
    console.error("Create Reconciliation Error:", error);
    res.status(500).json({
      error: "Failed to create reconciliation",
      details: error.message
    });
  }
});

// ==================== ADD DISCREPANCY ====================
router.post("/:id/discrepancies", async (req, res) => {
  try {
    const { id } = req.params;
    const { type, description, amount, journalEntryId } = req.body;

    if (!type || !description || amount === undefined) {
      return res.status(400).json({
        error: "Missing required fields: type, description, amount"
      });
    }

    const validTypes = ["OUTSTANDING_CHECK", "UNDEPOSITED_FUNDS", "BANK_CHARGE", "INTEREST", "ERROR"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        error: `Invalid discrepancy type. Must be one of: ${validTypes.join(", ")}`
      });
    }

    const result = await reconciliationService.addDiscrepancy(id, {
      type,
      description,
      amount,
      journalEntryId
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.status(201).json(result);
  } catch (error) {
    console.error("Add Discrepancy Error:", error);
    res.status(500).json({
      error: "Failed to add discrepancy",
      details: error.message
    });
  }
});

// ==================== RESOLVE DISCREPANCY ====================
router.put("/:id/discrepancies/:discrepancyId/resolve", async (req, res) => {
  try {
    const { id, discrepancyId } = req.params;
    const { journalEntryId } = req.body;

    const result = await reconciliationService.resolveDiscrepancy(
      id,
      discrepancyId,
      journalEntryId
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json(result);
  } catch (error) {
    console.error("Resolve Discrepancy Error:", error);
    res.status(500).json({
      error: "Failed to resolve discrepancy",
      details: error.message
    });
  }
});

// ==================== GET RECONCILIATION STATUS ====================
router.get("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await reconciliationService.calculateReconciliationStatus(id);

    if (!result.success) {
      return res.status(404).json({ error: result.error });
    }

    res.json(result.status);
  } catch (error) {
    console.error("Get Reconciliation Status Error:", error);
    res.status(500).json({
      error: "Failed to calculate reconciliation status",
      details: error.message
    });
  }
});

// ==================== UPDATE BOOK BALANCE ====================
router.put("/:id/book-balance", async (req, res) => {
  try {
    const { id } = req.params;
    const { balance } = req.body;

    if (balance === undefined) {
      return res.status(400).json({
        error: "balance field is required"
      });
    }

    const result = await reconciliationService.updateBookBalance(id, balance);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      message: "Book balance updated",
      reconciliation: result.reconciliation
    });
  } catch (error) {
    console.error("Update Book Balance Error:", error);
    res.status(500).json({
      error: "Failed to update book balance",
      details: error.message
    });
  }
});

// ==================== SUBMIT RECONCILIATION ====================
router.post("/:id/submit", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers["user-id"];

    if (!userId) {
      return res.status(401).json({ error: "User ID required" });
    }

    const result = await reconciliationService.submitReconciliation(id, userId);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json(result);
  } catch (error) {
    console.error("Submit Reconciliation Error:", error);
    res.status(500).json({
      error: "Failed to submit reconciliation",
      details: error.message
    });
  }
});

// ==================== ATTACH DOCUMENT TO RECONCILIATION ====================
router.post("/:id/attach", async (req, res) => {
  try {
    const { id } = req.params;
    const { fileName, fileType, fileSize, description, category } = req.body;
    const userId = req.headers["user-id"];

    if (!userId) {
      return res.status(401).json({ error: "User ID required" });
    }

    if (!fileName || !fileType) {
      return res.status(400).json({ error: "fileName and fileType are required" });
    }

    // Create attachment
    const attachment = new DocumentAttachment({
      referenceType: "BANK_RECONCILIATION",
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

    // Add to reconciliation
    const reconciliation = await BankReconciliation.findById(id);

    if (!reconciliation) {
      return res.status(404).json({ error: "Reconciliation not found" });
    }

    reconciliation.attachments.push(attachment._id);
    await reconciliation.save();

    res.status(201).json({
      message: "Document attached successfully",
      attachment,
      reconciliation
    });
  } catch (error) {
    console.error("Attach Document Error:", error);
    res.status(500).json({
      error: "Failed to attach document",
      details: error.message
    });
  }
});

// ==================== GET RECONCILIATION WITH ATTACHMENTS ====================
router.get("/:id/with-attachments", async (req, res) => {
  try {
    const reconciliation = await BankReconciliation.findById(req.params.id)
      .populate("attachments")
      .populate("discrepancies.journalEntryId")
      .populate("submittedBy", "username")
      .populate("approvedBy", "username");

    if (!reconciliation) {
      return res.status(404).json({ error: "Reconciliation not found" });
    }

    res.json(reconciliation);
  } catch (error) {
    console.error("Get Reconciliation Error:", error);
    res.status(500).json({
      error: "Failed to fetch reconciliation",
      details: error.message
    });
  }
});

// ==================== GET SINGLE RECONCILIATION ====================
router.get("/:id", async (req, res) => {
  try {
    const reconciliation = await BankReconciliation.findById(req.params.id)
      .populate("attachments")
      .populate("submittedBy", "username")
      .populate("approvedBy", "username");

    if (!reconciliation) {
      return res.status(404).json({ error: "Reconciliation not found" });
    }

    res.json(reconciliation);
  } catch (error) {
    console.error("Get Reconciliation Error:", error);
    
    if (error.name === "CastError") {
      return res.status(400).json({ error: "Invalid reconciliation ID format" });
    }

    res.status(500).json({
      error: "Failed to fetch reconciliation",
      details: error.message
    });
  }
});

module.exports = router;
