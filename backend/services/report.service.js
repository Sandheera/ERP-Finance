function trialBalance(accounts) {
  return accounts.map(a => ({
    account: a.code,
    debit: a.balance > 0 ? a.balance : 0,
    credit: a.balance < 0 ? -a.balance : 0
  }));
}

function balanceSheet(accounts) {
  return {
    assets: accounts.filter(a => a.type === "Asset"),
    liabilities: accounts.filter(a => a.type === "Liability"),
    equity: accounts.filter(a => a.type === "Equity")
  };
}

module.exports = { trialBalance, balanceSheet };
