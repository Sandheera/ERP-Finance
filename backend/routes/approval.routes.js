const express = require("express");
const router = express.Router();

const Invoice = require("../models/invoice.model");
const JournalEntry = require("../models/journal.model");

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
