const express = require("express");
const router = express.Router();
const Period = require("../models/Period");

// POST /api/closing/ (root endpoint)
router.post("/", async (req, res) => {
  try {
    const { month } = req.body;

    if (!month) {
      return res.status(400).json({ error: "Month is required" });
    }

    await Period.findOneAndUpdate(
      { month },
      { closed: true },
      { upsert: true, new: true }
    );

    res.json({ message: "Period closed successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/closing/close (legacy endpoint)
router.post("/close", async (req, res) => {
  try {
    const { month } = req.body;

    if (!month) {
      return res.status(400).json({ error: "Month is required" });
    }

    await Period.findOneAndUpdate(
      { month },
      { closed: true },
      { upsert: true, new: true }
    );

    res.json({ message: "Period closed successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
