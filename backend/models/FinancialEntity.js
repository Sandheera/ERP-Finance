class FinancialEntity {
  constructor(id, date, amount, status = "DRAFT") {
    this.id = id;
    this.date = date;
    this.amount = amount;
    this.status = status;
  }

  validate() {
    if (!this.amount || this.amount <= 0) {
      throw new Error("Invalid amount");
    }
  }
}

module.exports = FinancialEntity;
