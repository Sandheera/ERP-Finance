class ChartOfAccount {
  constructor(code, name, type, balance = 0) {
    this.code = code;
    this.name = name;
    this.type = type; // Asset, Liability, Equity, Revenue, Expense
    this.balance = balance;
  }
}

module.exports = ChartOfAccount;
