const express = require("express");
const router = express.Router();
const Journal = require("../models/journal.model");

// GET /api/reports/trial-balance
router.get("/trial-balance", async (req, res) => {
  try {
    const result = await Journal.aggregate([
      { $unwind: "$lines" },
      {
        $group: {
          _id: "$lines.account",
          debit: { $sum: "$lines.debit" },
          credit: { $sum: "$lines.credit" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // ✅ FIX: map _id → account
    const trialBalance = result.map(r => ({
      account: r._id,
      debit: r.debit,
      credit: r.credit
    }));

    res.json(trialBalance);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/trial-balance/pdf
router.get("/trial-balance/pdf", async (req, res) => {
  try {
    const result = await Journal.aggregate([
      { $unwind: "$lines" },
      {
        $group: {
          _id: "$lines.account",
          debit: { $sum: "$lines.debit" },
          credit: { $sum: "$lines.credit" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const trialBalance = result.map(r => ({
      account: r._id,
      debit: r.debit,
      credit: r.credit
    }));

    // Generate simple CSV/TSV format for download
    let csv = "Account\tDebit\tCredit\n";
    let totalDebit = 0;
    let totalCredit = 0;

    trialBalance.forEach(row => {
      csv += `${row.account}\t${row.debit.toFixed(2)}\t${row.credit.toFixed(2)}\n`;
      totalDebit += row.debit;
      totalCredit += row.credit;
    });

    csv += `\nTOTALS\t${totalDebit.toFixed(2)}\t${totalCredit.toFixed(2)}\n`;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=trial-balance.csv");
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
