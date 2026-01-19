const mongoose = require("mongoose");

const auditSchema = new mongoose.Schema({
  user: String,
  action: String,
  entity: String,
  entityId: String,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("AuditTrail", auditSchema);
