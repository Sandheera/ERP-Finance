function postJournalEntry(journal, accounts) {
  journal.validateBalance();

  journal.lines.forEach(line => {
    const account = accounts.find(a => a.code === line.account);
    if (!account) throw new Error("Account not found");

    if (["Asset", "Expense"].includes(account.type)) {
      account.balance += line.debit - line.credit;
    } else {
      account.balance += line.credit - line.debit;
    }
  });

  journal.status = "POSTED";
}

module.exports = { postJournalEntry };
