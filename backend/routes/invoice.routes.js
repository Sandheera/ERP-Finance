const express = require("express");
const router = express.Router();
const Invoice = require("../models/invoice.model");
const Journal = require("../models/journal.model");
const AuditTrail = require("../models/AuditTrail");

/* CREATE */
router.post("/", async (req, res) => {
  try {
    const invoice = await Invoice.create(req.body);

    // Create journal entry for the invoice
    const lines = [];
    if (invoice.type === "AR") {
      // AR: Debit Accounts Receivable, Credit Revenue
      lines.push({ account: "Accounts Receivable", debit: invoice.amount, credit: 0 });
      lines.push({ account: "Revenue", debit: 0, credit: invoice.amount });
    } else if (invoice.type === "AP") {
      // AP: Debit Expense, Credit Accounts Payable
      lines.push({ account: "Expense", debit: invoice.amount, credit: 0 });
      lines.push({ account: "Accounts Payable", debit: 0, credit: invoice.amount });
    }

    await Journal.create({
      description: `Invoice ${invoice._id} - ${invoice.partner}`,
      lines: lines
    });

    await AuditTrail.create({
      action: "CREATE",
      entity: "INVOICE",
      entityId: invoice._id,
      message: `Invoice ${invoice._id} created`
    });

    res.json(invoice);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/* READ ALL */
router.get("/", async (req, res) => {
  const invoices = await Invoice.find().sort({ createdAt: -1 });
  res.json(invoices);
});

/* READ ONE */
router.get("/:id", async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* UPDATE */
router.put("/:id", async (req, res) => {
  try {
    const { type, partner, amount, status } = req.body;
    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      { type, partner, amount, status },
      { new: true }
    );

    await AuditTrail.create({
      action: "UPDATE",
      entity: "INVOICE",
      entityId: req.params.id,
      message: `Invoice ${req.params.id} updated`
    });

    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* APPROVE */
router.post("/:id/approve", async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      { status: "APPROVED" },
      { new: true }
    );

    await AuditTrail.create({
      action: "APPROVE",
      entity: "INVOICE",
      entityId: req.params.id,
      message: `Invoice ${req.params.id} approved`
    });

    res.json({ message: "Invoice approved", invoice });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* DELETE */
router.delete("/:id", async (req, res) => {
  try {
    await Invoice.findByIdAndDelete(req.params.id);

    await AuditTrail.create({
      action: "DELETE",
      entity: "INVOICE",
      entityId: req.params.id,
      message: `Invoice ${req.params.id} deleted`
    });

    res.json({ message: "Invoice deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
