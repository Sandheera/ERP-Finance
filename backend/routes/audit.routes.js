const express = require("express");
const router = express.Router();
const AuditTrail = require("../models/AuditTrail");

router.get("/", async (req, res) => {
  try {
    const logs = await AuditTrail.find()
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: "Failed to load audit logs" });
  }
});

module.exports = router;
