require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const invoiceRoutes = require("./routes/invoice.routes");
const journalRoutes = require("./routes/journal.routes");
const reconciliationRoutes = require("./routes/reconciliation.routes");
const reportRoutes = require("./routes/report.routes");
const closingRoutes = require("./routes/closing.routes");
const approvalRoutes = require("./routes/approval.routes");
const auditRoutes = require("./routes/audit.routes");

const app = express();
const path = require("path");

app.use(cors());
app.use(express.json());

// 🔹 SERVE FRONTEND STATIC FILES
app.use(express.static(path.join(__dirname, "../frontend")));

// 🔹 ROUTES
app.use("/api/invoices", invoiceRoutes);
app.use("/api/journals", journalRoutes);
app.use("/api/reconciliations", reconciliationRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/closing", closingRoutes);
app.use("/api/approvals", approvalRoutes);
app.use("/api/audit", auditRoutes);

// 🔹 DB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error(err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});
