const Audit = require("../models/AuditTrail");

async function logAudit(user, action, entity, entityId) {
  await Audit.create({ user, action, entity, entityId });
}

module.exports = { logAudit };
