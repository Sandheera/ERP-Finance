function invoiceToJournal(invoice) {
  if (invoice.status !== "APPROVED") {
    throw new Error("Invoice not approved");
  }

  return {
    description:
      invoice.type === "AR" ? "Approved Customer Invoice" : "Approved Vendor Bill",
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
  };
}

module.exports = { invoiceToJournal };
