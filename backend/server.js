const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const invoiceRoutes = require("./routes/invoice.routes");
const reportRoutes = require("./routes/report.routes");
const closingRoutes = require("./routes/closing.routes");
const approvalRoutes = require("./routes/approval.routes");
const auditRoutes = require("./routes/audit.routes");

const app = express();

app.use(cors());
app.use(express.json());

// 🔹 ROUTES
app.use("/api/invoices", invoiceRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/closing", closingRoutes);
app.use("/api/approvals", approvalRoutes);
app.use("/api/audit", auditRoutes);

// 🔹 DB
mongoose
  .connect("mongodb://127.0.0.1:27017/erp_finance")
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error(err));

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});
