let currentEditId = null;
const API_URL = 'http://localhost:5000/api';

// Navbar navigation will be set up on DOMContentLoaded

function showPage(page) {
  document.querySelectorAll('.page-content').forEach(content => {
    content.classList.remove('active');
  });
  const pageContent = document.getElementById(`${page}Content`);
  if (pageContent) {
    pageContent.classList.add('active');
  }
  
  const titles = {
    'dashboard': 'Finance Dashboard',
    'journal': 'Journal Entries',
    'reconciliation': 'Bank Reconciliation',
    'invoices': 'Invoice Management',
    'reports': 'Financial Reports',
    'audit': 'Activity Log',
    'settings': 'System Settings'
  };
  document.getElementById('pageTitle').textContent = titles[page] || 'Finance Module';

  // Load data based on page
  if (page === 'dashboard') {
    loadDashboardKPIs();
    loadPendingApprovals();
  }
  if (page === 'journal') {
    loadDraftJournalEntries();
    loadSubmittedJournalEntries();
  }
  if (page === 'reconciliation') {
    loadReconciliations();
  }
  if (page === 'invoices') {
    loadInvoices();
  }
  if (page === 'audit') {
    loadActivityLog();
  }
}

function createInvoice() {
  const type = document.getElementById("type").value;
  const partner = document.getElementById("partner").value;
  const amount = document.getElementById("amount").value;

  if (!partner || !amount) {
    document.getElementById("invoiceError").textContent = "Please fill in all fields";
    return;
  }

  const payload = { type, partner, amount: parseFloat(amount) };

  fetch(`${API_URL}/invoices`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
    .then(res => res.json())
    .then(data => {
      document.getElementById("invoiceSuccess").textContent = "✓ Invoice created successfully!";
      document.getElementById("partner").value = "";
      document.getElementById("amount").value = "";
      document.getElementById("invoiceError").textContent = "";
      loadFinancialSummary();
      loadActivityLog();
      loadInvoices();
      loadTrialBalance();
      setTimeout(() => {
        document.getElementById("invoiceSuccess").textContent = "";
      }, 3000);
    })
    .catch(err => {
      console.error(err);
      document.getElementById("invoiceError").textContent = "Error creating invoice";
    });
}

function closeMonth() {
  const month = document.getElementById("month").value;

  if (!month) {
    document.getElementById("closingError").textContent = "Please select a month";
    return;
  }

  const payload = { month };

  fetch(`${API_URL}/closing`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
    .then(res => res.json())
    .then(data => {
      document.getElementById("closingSuccess").textContent = "✓ Period closed successfully!";
      document.getElementById("closingError").textContent = "";
      document.getElementById("month").value = "";
      loadActivityLog();
      setTimeout(() => {
        document.getElementById("closingSuccess").textContent = "";
      }, 3000);
    })
    .catch(err => {
      console.error(err);
      document.getElementById("closingError").textContent = "Error closing period";
    });
}

function loadTrialBalance() {
  fetch(`${API_URL}/reports/trial-balance`)
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById("trialBalanceContainer");

      if (!Array.isArray(data) || data.length === 0) {
        container.innerHTML = "<p class='empty-state'>No data available</p>";
        return;
      }

      let html = `
        <table style="width:100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="border: 1px solid #ddd; padding: 8px;">Account</th>
              <th style="border: 1px solid #ddd; padding: 8px;">Debit</th>
              <th style="border: 1px solid #ddd; padding: 8px;">Credit</th>
            </tr>
          </thead>
          <tbody>
      `;

      let totalDebit = 0;
      let totalCredit = 0;

      data.forEach(row => {
        const debit = parseFloat(row.debit) || 0;
        const credit = parseFloat(row.credit) || 0;
        totalDebit += debit;
        totalCredit += credit;
        html += `
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;"><strong>${row.account}</strong></td>
            <td style="border: 1px solid #ddd; padding: 8px;">$${debit.toFixed(2)}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">$${credit.toFixed(2)}</td>
          </tr>
        `;
      });

      html += `
        <tr style="background: #f0f0f0;">
          <td style="border: 1px solid #ddd; padding: 8px;"><strong>TOTALS</strong></td>
          <td style="border: 1px solid #ddd; padding: 8px;"><strong>$${totalDebit.toFixed(2)}</strong></td>
          <td style="border: 1px solid #ddd; padding: 8px;"><strong>$${totalCredit.toFixed(2)}</strong></td>
        </tr>
      `;

      html += "</tbody></table>";
      container.innerHTML = html;
    })
    .catch(err => {
      console.error(err);
      document.getElementById("trialBalanceContainer").innerHTML = "<p class='empty-state'>Error loading trial balance</p>";
    });
}

function downloadTrialBalance() {
  const link = document.createElement("a");
  link.href = `${API_URL}/reports/trial-balance/pdf`;
  link.download = "trial-balance.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function loadFinancialSummary() {
  fetch(`${API_URL}/invoices`)
    .then(res => res.json())
    .then(invoices => {
      if (!Array.isArray(invoices)) {
        invoices = [];
      }

      let totalAR = 0;
      let totalAP = 0;
      let approvedCount = 0;

      invoices.forEach(inv => {
        const amount = parseFloat(inv.amount) || 0;
        if (inv.type === "AR") {
          totalAR += amount;
        } else if (inv.type === "AP") {
          totalAP += amount;
        }
        if (inv.status === "APPROVED") {
          approvedCount++;
        }
      });

      document.getElementById("totalAR").textContent = `$${totalAR.toFixed(2)}`;
      document.getElementById("totalAP").textContent = `$${totalAP.toFixed(2)}`;
      document.getElementById("totalInvoices").textContent = invoices.length;
      document.getElementById("approvedCount").textContent = approvedCount;
    })
    .catch(err => {
      console.error(err);
    });
}

function loadActivityLog() {
  fetch(`${API_URL}/audit`)
    .then(res => res.json())
    .then(logs => {
      const container = document.getElementById("activityLog");

      if (!Array.isArray(logs) || logs.length === 0) {
        container.innerHTML = '<li class="empty-state">No activity yet</li>';
        return;
      }

      let html = "";
      logs.forEach(log => {
        const date = new Date(log.createdAt).toLocaleString();
        html += `<li><strong>${log.action}</strong> - ${log.message} <br/><small>${date}</small></li>`;
      });

      container.innerHTML = html;
    })
    .catch(err => {
      console.error(err);
      document.getElementById("activityLog").innerHTML = '<li class="empty-state">Error loading activity log</li>';
    });
}

function loadInvoices() {
  fetch(`${API_URL}/invoices`)
    .then(res => res.json())
    .then(invoices => {
      const tableBody = document.getElementById("invoiceTableBody");
      const table = document.getElementById("invoiceTable");
      const message = document.getElementById("invoiceListMessage");

      if (!Array.isArray(invoices) || invoices.length === 0) {
        table.style.display = "none";
        message.textContent = "No invoices found";
        return;
      }

      table.style.display = "table";
      message.textContent = "";
      tableBody.innerHTML = "";

      invoices.forEach(inv => {
        const row = document.createElement("tr");
        const statusColor = inv.status === "APPROVED" ? "#e8f5e9" : "#fff3e0";
        const textColor = inv.status === "APPROVED" ? "#2e7d32" : "#f57c00";
        row.innerHTML = `
          <td>${inv.type}</td>
          <td>${inv.partner}</td>
          <td>$${parseFloat(inv.amount).toFixed(2)}</td>
          <td><span style="background:${statusColor};color:${textColor};padding:3px 8px;border-radius:3px;font-weight:600;">${inv.status}</span></td>
          <td>
            <button class="btn btn-primary btn-sm" onclick="editInvoice('${inv._id}', '${inv.type}', '${inv.partner}', ${inv.amount})" style="margin-right: 5px;"><i class="fas fa-edit"></i> Edit</button>
            ${inv.status !== "APPROVED" ? `<button class="btn btn-success btn-sm" onclick="approveInvoice('${inv._id}')" style="margin-right: 5px;"><i class="fas fa-check"></i> Approve</button>` : ""}
            <button class="btn btn-danger btn-sm" onclick="deleteInvoice('${inv._id}')"><i class="fas fa-trash"></i> Delete</button>
          </td>
        `;
        tableBody.appendChild(row);
      });
    })
    .catch(err => {
      console.error(err);
      document.getElementById("invoiceListMessage").textContent = "Error loading invoices";
    });
}

function editInvoice(invoiceId, type, partner, amount) {
  currentEditId = invoiceId;
  document.getElementById("editType").value = type;
  document.getElementById("editPartner").value = partner;
  document.getElementById("editAmount").value = amount;
  document.getElementById("editModal").classList.add("active");
}

function closeEditModal() {
  document.getElementById("editModal").classList.remove("active");
  currentEditId = null;
}

function saveEditInvoice() {
  if (!currentEditId) return;

  const type = document.getElementById("editType").value;
  const partner = document.getElementById("editPartner").value;
  const amount = document.getElementById("editAmount").value;

  if (!partner || !amount) {
    alert("Please fill in all fields");
    return;
  }

  const payload = { type, partner, amount: parseFloat(amount) };

  fetch(`${API_URL}/invoices/${currentEditId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
    .then(res => res.json())
    .then(data => {
      alert("Invoice updated successfully!");
      closeEditModal();
      loadFinancialSummary();
      loadActivityLog();
      loadInvoices();
      loadTrialBalance();
    })
    .catch(err => {
      console.error(err);
      alert("Error updating invoice");
    });
}

function approveInvoice(invoiceId) {
  if (!confirm("Are you sure you want to approve this invoice?")) {
    return;
  }

  fetch(`${API_URL}/invoices/${invoiceId}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" }
  })
    .then(res => res.json())
    .then(data => {
      alert("Invoice approved successfully!");
      loadActivityLog();
      loadInvoices();
      loadFinancialSummary();
    })
    .catch(err => {
      console.error(err);
      alert("Error approving invoice");
    });
}

function deleteInvoice(invoiceId) {
  if (!confirm("Are you sure you want to delete this invoice?")) {
    return;
  }

  fetch(`${API_URL}/invoices/${invoiceId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" }
  })
    .then(res => res.json())
    .then(data => {
      alert("Invoice deleted successfully!");
      loadFinancialSummary();
      loadActivityLog();
      loadInvoices();
      loadTrialBalance();
    })
    .catch(err => {
      console.error(err);
      alert("Error deleting invoice");
    });
}

function generateReport(type) {
  const container = document.getElementById("reportContainer");
  
  if (!type) {
    container.innerHTML = '<p class="empty-state">Select a report type to generate</p>';
    return;
  }

  if (type === 'trial-balance') {
    fetch(`${API_URL}/reports/trial-balance`)
      .then(res => res.json())
      .then(data => {
        if (!Array.isArray(data) || data.length === 0) {
          container.innerHTML = "<p class='empty-state'>No data</p>";
          return;
        }

        let html = `<table style="width:100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="border: 1px solid #ddd; padding: 8px;">Account</th>
              <th style="border: 1px solid #ddd; padding: 8px;">Debit</th>
              <th style="border: 1px solid #ddd; padding: 8px;">Credit</th>
            </tr>
          </thead>
          <tbody>`;
        
        let totalDebit = 0, totalCredit = 0;
        data.forEach(row => {
          const debit = parseFloat(row.debit) || 0;
          const credit = parseFloat(row.credit) || 0;
          totalDebit += debit;
          totalCredit += credit;
          html += `<tr>
            <td style="border: 1px solid #ddd; padding: 8px;">${row.account}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">$${debit.toFixed(2)}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">$${credit.toFixed(2)}</td>
          </tr>`;
        });
        
        html += `<tr style="background: #f0f0f0;">
          <td style="border: 1px solid #ddd; padding: 8px;"><strong>TOTALS</strong></td>
          <td style="border: 1px solid #ddd; padding: 8px;"><strong>$${totalDebit.toFixed(2)}</strong></td>
          <td style="border: 1px solid #ddd; padding: 8px;"><strong>$${totalCredit.toFixed(2)}</strong></td>
        </tr></tbody></table>`;
        
        container.innerHTML = html;
      });
  } else if (type === 'summary') {
    fetch(`${API_URL}/invoices`)
      .then(res => res.json())
      .then(invoices => {
        let totalAR = 0, totalAP = 0, approvedCount = 0;
        invoices.forEach(inv => {
          const amount = parseFloat(inv.amount) || 0;
          if (inv.type === "AR") totalAR += amount;
          else if (inv.type === "AP") totalAP += amount;
          if (inv.status === "APPROVED") approvedCount++;
        });

        const html = `<div style="padding: 20px;">
          <p><strong>Total Invoices:</strong> ${invoices.length}</p>
          <p><strong>Total AR:</strong> $${totalAR.toFixed(2)}</p>
          <p><strong>Total AP:</strong> $${totalAP.toFixed(2)}</p>
          <p><strong>Net Position:</strong> $${(totalAR - totalAP).toFixed(2)}</p>
          <p><strong>Approved Invoices:</strong> ${approvedCount}</p>
          <p><strong>Pending Invoices:</strong> ${invoices.length - approvedCount}</p>
        </div>`;
        
        container.innerHTML = html;
      });
  }
}

function testConnection() {
  fetch(`${API_URL}/invoices`)
    .then(res => res.json())
    .then(data => {
      alert("✓ Connection successful! Backend API is responding.");
    })
    .catch(err => {
      alert("✗ Connection failed! Make sure backend is running on port 5000.");
    });
}

// ==================== ACCOUNTANT: JOURNAL ENTRY FUNCTIONS ====================

function createJournalEntry() {
  const period = document.getElementById("journalPeriod").value;
  const account = document.getElementById("journalAccount").value;
  const debit = parseFloat(document.getElementById("journalDebit").value) || 0;
  const credit = parseFloat(document.getElementById("journalCredit").value) || 0;
  const description = document.getElementById("journalDescription").value;
  const comments = document.getElementById("journalComments").value;

  if (!period || !account) {
    document.getElementById("journalError").textContent = "Please fill in required fields (Period, Account)";
    return;
  }

  if (debit === 0 && credit === 0) {
    document.getElementById("journalError").textContent = "Either debit or credit must be greater than 0";
    return;
  }

  const payload = {
    period: period,
    account: account.trim(),
    debit,
    credit,
    description: description || "Manual entry",
    comments
  };

  fetch(`${API_URL}/journals`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "user-id": "accountant-001" // TODO: Get from session
    },
    body: JSON.stringify(payload)
  })
    .then(res => res.json())
    .then(data => {
      document.getElementById("journalSuccess").textContent = "✓ Journal entry saved as draft!";
      document.getElementById("journalError").textContent = "";
      clearJournalForm();
      loadDraftJournalEntries();
      setTimeout(() => {
        document.getElementById("journalSuccess").textContent = "";
      }, 3000);
    })
    .catch(err => {
      console.error(err);
      document.getElementById("journalError").textContent = "Error creating journal entry";
    });
}

function submitJournalEntry() {
  const period = document.getElementById("journalPeriod").value;
  const account = document.getElementById("journalAccount").value;
  const debit = parseFloat(document.getElementById("journalDebit").value) || 0;
  const credit = parseFloat(document.getElementById("journalCredit").value) || 0;
  const description = document.getElementById("journalDescription").value;
  const comments = document.getElementById("journalComments").value;

  if (!period || !account || (debit === 0 && credit === 0)) {
    document.getElementById("journalError").textContent = "Please fill in all required fields";
    return;
  }

  // First create the entry
  const payload = {
    period: period,
    account: account.trim(),
    debit,
    credit,
    description: description || "Manual entry",
    comments
  };

  fetch(`${API_URL}/journals`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "user-id": "accountant-001"
    },
    body: JSON.stringify(payload)
  })
    .then(res => res.json())
    .then(data => {
      if (data.entry && data.entry._id) {
        // Submit the entry
        return fetch(`${API_URL}/journals/${data.entry._id}/submit`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "user-id": "accountant-001"
          }
        });
      }
      throw new Error("Failed to create entry");
    })
    .then(res => res.json())
    .then(data => {
      document.getElementById("journalSuccess").textContent = "✓ Journal entry submitted for approval!";
      document.getElementById("journalError").textContent = "";
      clearJournalForm();
      loadDraftJournalEntries();
      loadSubmittedJournalEntries();
      setTimeout(() => {
        document.getElementById("journalSuccess").textContent = "";
      }, 3000);
    })
    .catch(err => {
      console.error(err);
      document.getElementById("journalError").textContent = "Error submitting journal entry";
    });
}

function clearJournalForm() {
  document.getElementById("journalPeriod").value = "";
  document.getElementById("journalAccount").value = "";
  document.getElementById("journalDebit").value = "";
  document.getElementById("journalCredit").value = "";
  document.getElementById("journalDescription").value = "";
  document.getElementById("journalComments").value = "";
}

function loadDraftJournalEntries() {
  fetch(`${API_URL}/journals/accountant/drafts`, {
    headers: {
      "user-id": "accountant-001"
    }
  })
    .then(res => res.json())
    .then(data => {
      const tbody = document.getElementById("draftJournalBody");
      const table = document.getElementById("draftJournalTable");
      const message = document.getElementById("draftJournalMessage");

      if (!Array.isArray(data.entries) || data.entries.length === 0) {
        table.style.display = "none";
        message.textContent = "No draft entries found";
        return;
      }

      table.style.display = "table";
      message.textContent = "";
      tbody.innerHTML = "";

      data.entries.forEach(entry => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${entry.period || "N/A"}</td>
          <td>${entry.account || entry.lines?.[0]?.account || "N/A"}</td>
          <td>$${(entry.debit || 0).toFixed(2)}</td>
          <td>$${(entry.credit || 0).toFixed(2)}</td>
          <td><span style="background:#fff3e0;color:#f57c00;padding:3px 8px;border-radius:3px;font-weight:600;">DRAFT</span></td>
          <td>
            <button class="btn btn-primary btn-sm" onclick="editJournalEntry('${entry._id}')" style="margin-right: 5px;"><i class="fas fa-edit"></i> Edit</button>
            <button class="btn btn-success btn-sm" onclick="submitJournalEntryById('${entry._id}')" style="margin-right: 5px;"><i class="fas fa-send"></i> Submit</button>
            <button class="btn btn-danger btn-sm" onclick="deleteJournalEntry('${entry._id}')"><i class="fas fa-trash"></i> Delete</button>
          </td>
        `;
        tbody.appendChild(row);
      });
    })
    .catch(err => {
      console.error(err);
      document.getElementById("draftJournalMessage").textContent = "Error loading draft entries";
    });
}

function loadSubmittedJournalEntries() {
  fetch(`${API_URL}/journals/accountant/submitted`, {
    headers: {
      "user-id": "accountant-001"
    }
  })
    .then(res => res.json())
    .then(data => {
      const tbody = document.getElementById("submittedJournalBody");
      const table = document.getElementById("submittedJournalTable");
      const message = document.getElementById("submittedJournalMessage");

      if (!Array.isArray(data.entries) || data.entries.length === 0) {
        table.style.display = "none";
        message.textContent = "No submitted entries found";
        return;
      }

      table.style.display = "table";
      message.textContent = "";
      tbody.innerHTML = "";

      data.entries.forEach(entry => {
        const submittedDate = new Date(entry.submittedAt).toLocaleDateString();
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${entry.period || "N/A"}</td>
          <td>${entry.account || entry.lines?.[0]?.account || "N/A"}</td>
          <td>$${(entry.debit || 0).toFixed(2)}</td>
          <td>$${(entry.credit || 0).toFixed(2)}</td>
          <td><span style="background:#e3f2fd;color:#1976d2;padding:3px 8px;border-radius:3px;font-weight:600;">SUBMITTED</span></td>
          <td>${submittedDate}</td>
          <td>
            <button class="btn btn-primary btn-sm" onclick="viewJournalEntry('${entry._id}')"><i class="fas fa-eye"></i> View</button>
          </td>
        `;
        tbody.appendChild(row);
      });
    })
    .catch(err => {
      console.error(err);
      document.getElementById("submittedJournalMessage").textContent = "Error loading submitted entries";
    });
}

function submitJournalEntryById(entryId) {
  if (!confirm("Submit this journal entry for approval?")) {
    return;
  }

  fetch(`${API_URL}/journals/${entryId}/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "user-id": "accountant-001"
    }
  })
    .then(res => res.json())
    .then(data => {
      alert("Journal entry submitted for approval!");
      loadDraftJournalEntries();
      loadSubmittedJournalEntries();
    })
    .catch(err => {
      console.error(err);
      alert("Error submitting journal entry");
    });
}

function deleteJournalEntry(entryId) {
  if (!confirm("Delete this journal entry? This action cannot be undone.")) {
    return;
  }

  fetch(`${API_URL}/journals/${entryId}`, {
    method: "DELETE",
    headers: { 
      "Content-Type": "application/json",
      "user-id": "accountant-001"
    }
  })
    .then(res => res.json())
    .then(data => {
      alert("Journal entry deleted successfully!");
      loadDraftJournalEntries();
    })
    .catch(err => {
      console.error(err);
      alert("Error deleting journal entry");
    });
}

function viewJournalEntry(entryId) {
  fetch(`${API_URL}/journals/${entryId}/with-attachments`, {
    headers: {
      "user-id": "accountant-001"
    }
  })
    .then(res => res.json())
    .then(data => {
      alert(`Journal Entry Details:\n\nPeriod: ${data.period}\nAccount: ${data.account}\nDebit: $${data.debit}\nCredit: $${data.credit}\nStatus: ${data.status}\nDescription: ${data.description}`);
    })
    .catch(err => {
      console.error(err);
      alert("Error loading journal entry");
    });
}

// ==================== ACCOUNTANT: BANK RECONCILIATION FUNCTIONS ====================

function createBankReconciliation() {
  const period = document.getElementById("reconPeriod").value;
  const bankBalance = parseFloat(document.getElementById("reconBankBalance").value) || 0;
  const bookBalance = parseFloat(document.getElementById("reconBookBalance").value) || 0;
  const bankDate = document.getElementById("reconBankDate").value;
  const notes = document.getElementById("reconNotes").value;

  if (!period || bankBalance === 0 || bookBalance === 0) {
    document.getElementById("reconError").textContent = "Please fill in all required fields";
    return;
  }

  const payload = {
    period: period.replace("-", "-"),
    bankBalance,
    bookBalance,
    bankDate: bankDate || new Date().toISOString(),
    bankFileName: "Bank Statement",
    notes
  };

  fetch(`${API_URL}/reconciliations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "user-id": "accountant-001"
    },
    body: JSON.stringify(payload)
  })
    .then(res => res.json())
    .then(data => {
      document.getElementById("reconSuccess").textContent = "✓ Bank reconciliation created!";
      document.getElementById("reconError").textContent = "";
      clearReconciliationForm();
      loadReconciliations();
      showDiscrepanciesSection(data.reconciliation._id, bankBalance, bookBalance);
      setTimeout(() => {
        document.getElementById("reconSuccess").textContent = "";
      }, 3000);
    })
    .catch(err => {
      console.error(err);
      document.getElementById("reconError").textContent = "Error creating reconciliation";
    });
}

function clearReconciliationForm() {
  document.getElementById("reconPeriod").value = "";
  document.getElementById("reconBankBalance").value = "";
  document.getElementById("reconBookBalance").value = "";
  document.getElementById("reconBankDate").value = "";
  document.getElementById("reconNotes").value = "";
}

function loadReconciliations() {
  fetch(`${API_URL}/reconciliations/drafts/list`)
    .then(res => res.json())
    .then(data => {
      const tbody = document.getElementById("reconciliationBody");
      const table = document.getElementById("reconciliationTable");
      const message = document.getElementById("reconciliationMessage");

      if (!Array.isArray(data.reconciliations) || data.reconciliations.length === 0) {
        table.style.display = "none";
        message.textContent = "No reconciliations found";
        return;
      }

      table.style.display = "table";
      message.textContent = "";
      tbody.innerHTML = "";

      data.reconciliations.forEach(recon => {
        const difference = (recon.bankStatement?.balance || 0) - (recon.bookBalance || 0);
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${recon.period || "N/A"}</td>
          <td>$${(recon.bankStatement?.balance || 0).toFixed(2)}</td>
          <td>$${(recon.bookBalance || 0).toFixed(2)}</td>
          <td style="color: ${Math.abs(difference) < 0.01 ? 'green' : 'red'};">$${difference.toFixed(2)}</td>
          <td><span style="background:#fff3e0;color:#f57c00;padding:3px 8px;border-radius:3px;font-weight:600;">DRAFT</span></td>
          <td>
            <button class="btn btn-primary btn-sm" onclick="viewReconciliation('${recon._id}')" style="margin-right: 5px;"><i class="fas fa-eye"></i> View</button>
            <button class="btn btn-warning btn-sm" onclick="addDiscrepancyUI('${recon._id}')" style="margin-right: 5px;"><i class="fas fa-plus"></i> Add Discrepancy</button>
            <button class="btn btn-success btn-sm" onclick="submitReconciliation('${recon._id}')"><i class="fas fa-send"></i> Submit</button>
          </td>
        `;
        tbody.appendChild(row);
      });
    })
    .catch(err => {
      console.error(err);
      document.getElementById("reconciliationMessage").textContent = "Error loading reconciliations";
    });
}

function viewReconciliation(reconId) {
  fetch(`${API_URL}/reconciliations/${reconId}/with-attachments`)
    .then(res => res.json())
    .then(data => {
      const difference = (data.bankStatement?.balance || 0) - (data.bookBalance || 0);
      const reconciled = Math.abs(difference) < 0.01;
      alert(`Bank Reconciliation Details:\n\nPeriod: ${data.period}\nBank Balance: $${(data.bankStatement?.balance || 0).toFixed(2)}\nBook Balance: $${(data.bookBalance || 0).toFixed(2)}\nDifference: $${difference.toFixed(2)}\nReconciled: ${reconciled ? 'Yes' : 'No'}\nDiscrepancies: ${data.discrepancies.length}`);
    })
    .catch(err => {
      console.error(err);
      alert("Error loading reconciliation");
    });
}

function addDiscrepancyUI(reconId) {
  document.getElementById("discrepanciesSection").style.display = "block";
  document.getElementById("discrepanciesSection").dataset.reconId = reconId;
}

function addDiscrepancy() {
  const reconId = window.currentReconciliationId;
  
  if (!reconId) {
    alert("Error: No reconciliation selected");
    return;
  }
  
  const type = document.getElementById("discrepancyType").value;
  const description = document.getElementById("discrepancyDescription").value;
  const amount = parseFloat(document.getElementById("discrepancyAmount").value) || 0;

  if (!type || !description || amount === 0) {
    document.getElementById("discrepancyError").textContent = "Please fill in all required fields";
    return;
  }

  const payload = {
    type,
    description,
    amount
  };

  fetch(`${API_URL}/reconciliations/${reconId}/discrepancies`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "user-id": "accountant-001"
    },
    body: JSON.stringify(payload)
  })
    .then(res => res.json())
    .then(data => {
      document.getElementById("discrepancySuccess").textContent = "✓ Discrepancy added!";
      document.getElementById("discrepancyError").textContent = "";
      document.getElementById("discrepancyType").value = "";
      document.getElementById("discrepancyDescription").value = "";
      document.getElementById("discrepancyAmount").value = "";
      setTimeout(() => {
        document.getElementById("discrepancySuccess").textContent = "";
      }, 2000);
    })
    .catch(err => {
      console.error(err);
      document.getElementById("discrepancyError").textContent = "Error adding discrepancy";
    });
}

function submitReconciliation(reconId) {
  // Use parameter or global variable
  const id = reconId || window.currentReconciliationId;
  
  if (!id) {
    alert("Error: No reconciliation selected");
    return;
  }
  
  if (!confirm("Submit this reconciliation for approval? Make sure all discrepancies are resolved.")) {
    return;
  }

  fetch(`${API_URL}/reconciliations/${id}/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "user-id": "accountant-001"
    }
  })
    .then(res => res.json())
    .then(data => {
      alert("Bank reconciliation submitted for approval!");
      loadReconciliations();
      document.getElementById("discrepanciesSection").style.display = "none";
      window.currentReconciliationId = null;
    })
    .catch(err => {
      console.error(err);
      alert("Error submitting reconciliation");
    });
}

function showPage(page) {
  document.querySelectorAll('.page-content').forEach(content => {
    content.classList.remove('active');
  });
  const pageContent = document.getElementById(`${page}Content`);
  if (pageContent) {
    pageContent.classList.add('active');
  }
  
  const titles = {
    'dashboard': 'Finance Dashboard',
    'journal': 'Journal Entries',
    'reconciliation': 'Bank Reconciliation',
    'invoices': 'Invoice Management',
    'reports': 'Financial Reports',
    'audit': 'Activity Log',
    'settings': 'System Settings'
  };
  document.getElementById('pageTitle').textContent = titles[page] || 'Finance Module';

  if (page === 'journal') {
    loadDraftJournalEntries();
    loadSubmittedJournalEntries();
  }
  if (page === 'reconciliation') {
    loadReconciliations();
  }
  if (page === 'invoices') loadInvoices();
  if (page === 'dashboard') {
    loadDashboardKPIs();
    loadPendingApprovals();
  }
  if (page === 'audit') loadActivityLog();
}

// ==================== FINANCE MANAGER: DASHBOARD KPIs ====================
function loadDashboardKPIs() {
  fetch(`${API_URL}/approvals/statistics`, {
    headers: {
      "user-id": "manager-001" // TODO: Get from session
    }
  })
    .then(res => res.json())
    .then(data => {
      const kpiContainer = document.getElementById("kpiMetrics");
      if (!kpiContainer) return;
      
      const { journalEntries, invoices, metrics } = data;
      
      // Create KPI cards
      const kpiHtml = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin-bottom: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
            <div style="font-size: 0.9rem; opacity: 0.9;">Pending Approvals</div>
            <div style="font-size: 2.5rem; font-weight: bold; margin: 10px 0;">${metrics.pendingApprovals}</div>
            <div style="font-size: 0.85rem; opacity: 0.8;">Journal entries awaiting review</div>
          </div>
          
          <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
            <div style="font-size: 0.9rem; opacity: 0.9;">Pending Amount</div>
            <div style="font-size: 2.5rem; font-weight: bold; margin: 10px 0;">$${metrics.pendingAmount.toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
            <div style="font-size: 0.85rem; opacity: 0.8;">Total value pending review</div>
          </div>
          
          <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
            <div style="font-size: 0.9rem; opacity: 0.9;">Approval Rate</div>
            <div style="font-size: 2.5rem; font-weight: bold; margin: 10px 0;">${metrics.approvalRate}%</div>
            <div style="font-size: 0.85rem; opacity: 0.8;">Of total journal entries approved</div>
          </div>
          
          <div style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
            <div style="font-size: 0.9rem; opacity: 0.9;">Approved Entries</div>
            <div style="font-size: 2.5rem; font-weight: bold; margin: 10px 0;">${journalEntries.approved}</div>
            <div style="font-size: 0.85rem; opacity: 0.8;">Total approved in period</div>
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-bottom: 20px;">
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea;">
            <div style="font-size: 0.8rem; color: #666;">Submitted</div>
            <div style="font-size: 1.8rem; font-weight: bold; color: #667eea;">${journalEntries.submitted}</div>
          </div>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; border-left: 4px solid #43e97b;">
            <div style="font-size: 0.8rem; color: #666;">Approved</div>
            <div style="font-size: 1.8rem; font-weight: bold; color: #43e97b;">${journalEntries.approved}</div>
          </div>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; border-left: 4px solid #f5576c;">
            <div style="font-size: 0.8rem; color: #666;">Posted</div>
            <div style="font-size: 1.8rem; font-weight: bold; color: #f5576c;">${journalEntries.posted}</div>
          </div>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; border-left: 4px solid #ffa502;">
            <div style="font-size: 0.8rem; color: #666;">Draft</div>
            <div style="font-size: 1.8rem; font-weight: bold; color: #ffa502;">${journalEntries.draft}</div>
          </div>
        </div>
      `;
      
      kpiContainer.innerHTML = kpiHtml;
    })
    .catch(err => {
      console.error("Error loading KPIs:", err);
      if (document.getElementById("kpiMetrics")) {
        document.getElementById("kpiMetrics").innerHTML = "<p style='color: red;'>Error loading KPI data</p>";
      }
    });
}

// ==================== FINANCE MANAGER: PENDING APPROVALS ====================
function loadPendingApprovals() {
  fetch(`${API_URL}/approvals/journal/pending`, {
    headers: {
      "user-id": "manager-001"
    }
  })
    .then(res => res.json())
    .then(data => {
      const pendingContainer = document.getElementById("pendingApprovalsBody");
      const pendingTable = document.getElementById("pendingApprovalsTable");
      const message = document.getElementById("pendingApprovalsMessage");
      
      if (!Array.isArray(data.entries) || data.entries.length === 0) {
        if (pendingTable) pendingTable.style.display = "none";
        if (message) message.textContent = "No pending approvals";
        return;
      }
      
      if (pendingTable) pendingTable.style.display = "table";
      if (message) message.textContent = "";
      if (pendingContainer) pendingContainer.innerHTML = "";
      
      data.entries.forEach(entry => {
        const submittedDate = entry.submittedAt ? new Date(entry.submittedAt).toLocaleDateString() : "N/A";
        const submitterName = entry.submittedBy?.username || "Unknown";
        
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${entry.period || "N/A"}</td>
          <td>${entry.account || "N/A"}</td>
          <td>$${(entry.debit || 0).toFixed(2)}</td>
          <td>$${(entry.credit || 0).toFixed(2)}</td>
          <td>${entry.description || "N/A"}</td>
          <td>${submittedDate}</td>
          <td>${submitterName}</td>
          <td>
            <button class="btn btn-success btn-sm" onclick="approveJournalEntry('${entry._id}')" style="margin-right: 5px;"><i class="fas fa-check"></i> Approve</button>
            <button class="btn btn-danger btn-sm" onclick="rejectJournalEntry('${entry._id}')" style="margin-right: 5px;"><i class="fas fa-times"></i> Reject</button>
            <button class="btn btn-info btn-sm" onclick="viewEntryDetails('${entry._id}')"><i class="fas fa-eye"></i> View</button>
          </td>
        `;
        pendingContainer.appendChild(row);
      });
    })
    .catch(err => {
      console.error("Error loading pending approvals:", err);
      if (document.getElementById("pendingApprovalsMessage")) {
        document.getElementById("pendingApprovalsMessage").textContent = "Error loading pending approvals";
      }
    });
}

// ==================== APPROVE JOURNAL ENTRY ====================
function approveJournalEntry(entryId) {
  const comments = prompt("Enter approval comments (optional):");
  
  fetch(`${API_URL}/approvals/journal/${entryId}/approve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "user-id": "manager-001"
    },
    body: JSON.stringify({ reviewerComments: comments || "" })
  })
    .then(res => res.json())
    .then(data => {
      if (data.message) {
        alert("Journal entry approved successfully!");
        loadPendingApprovals();
        loadDashboardKPIs();
      } else {
        alert("Error: " + (data.error || "Failed to approve entry"));
      }
    })
    .catch(err => {
      console.error("Error approving entry:", err);
      alert("Error approving journal entry");
    });
}

// ==================== REJECT JOURNAL ENTRY ====================
function rejectJournalEntry(entryId) {
  const reason = prompt("Enter rejection reason (required):");
  
  if (!reason) {
    alert("Rejection reason is required");
    return;
  }
  
  fetch(`${API_URL}/approvals/journal/${entryId}/reject`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "user-id": "manager-001"
    },
    body: JSON.stringify({ reviewerComments: reason })
  })
    .then(res => res.json())
    .then(data => {
      if (data.message) {
        alert("Journal entry rejected and returned to draft");
        loadPendingApprovals();
        loadDashboardKPIs();
      } else {
        alert("Error: " + (data.error || "Failed to reject entry"));
      }
    })
    .catch(err => {
      console.error("Error rejecting entry:", err);
      alert("Error rejecting journal entry");
    });
}

// ==================== VIEW ENTRY DETAILS ====================
function viewEntryDetails(entryId) {
  fetch(`${API_URL}/journals/${entryId}`, {
    headers: {
      "user-id": "manager-001"
    }
  })
    .then(res => res.json())
    .then(data => {
      const details = `
        Account: ${data.account}
        Period: ${data.period}
        Debit: $${(data.debit || 0).toFixed(2)}
        Credit: $${(data.credit || 0).toFixed(2)}
        Description: ${data.description || "N/A"}
        Comments: ${data.comments || "N/A"}
        Status: ${data.status}
        Submitted By: ${data.submittedBy?.username || "N/A"}
        Submitted At: ${data.submittedAt ? new Date(data.submittedAt).toLocaleString() : "N/A"}
      `;
      alert(details);
    })
    .catch(err => {
      console.error("Error viewing entry:", err);
      alert("Error loading entry details");
    });
}

// ==================== EDIT JOURNAL ENTRY ====================
function editJournalEntry(entryId) {
  fetch(`${API_URL}/journals/${entryId}`, {
    headers: {
      "user-id": "accountant-001"
    }
  })
    .then(res => res.json())
    .then(data => {
      if (data.status !== "DRAFT") {
        alert("Only draft entries can be edited");
        return;
      }
      
      document.getElementById("journalPeriod").value = data.period || "";
      document.getElementById("journalAccount").value = data.account || "";
      document.getElementById("journalDebit").value = data.debit || "";
      document.getElementById("journalCredit").value = data.credit || "";
      document.getElementById("journalDescription").value = data.description || "";
      currentEditId = entryId;
      
      // Scroll to form
      document.getElementById("journalContent").scrollIntoView({ behavior: "smooth" });
      alert("Edit mode - Update the entry and save");
    })
    .catch(err => {
      console.error("Error loading entry:", err);
      alert("Error loading entry for editing");
    });
}

// ==================== SHOW DISCREPANCIES SECTION ====================
function showDiscrepanciesSection(reconciliationId, bankBalance, bookBalance) {
  const discrepanciesSection = document.getElementById("discrepanciesSection");
  if (!discrepanciesSection) {
    console.warn("Discrepancies section not found in HTML");
    return;
  }
  
  // Store reconciliation ID for use in addDiscrepancy
  window.currentReconciliationId = reconciliationId;
  
  // Clear previous discrepancies
  document.getElementById("discrepancyType").value = "";
  document.getElementById("discrepancyDescription").value = "";
  document.getElementById("discrepancyAmount").value = "";
  document.getElementById("discrepancySuccess").textContent = "";
  document.getElementById("discrepancyError").textContent = "";
  
  // Show the section
  discrepanciesSection.style.display = "block";
  
  // Scroll to section
  setTimeout(() => {
    discrepanciesSection.scrollIntoView({ behavior: "smooth" });
  }, 100);
}

// ==================== PAGE INITIALIZATION ====================
// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', function() {
  // Load initial dashboard data
  loadDashboardKPIs();
  loadPendingApprovals();
  
  // Set up menu navigation
  document.querySelectorAll('.menu-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = e.target.closest('a').getAttribute('data-page');
      showPage(page);
      document.querySelectorAll('.menu-link').forEach(l => l.classList.remove('active'));
      e.target.closest('a').classList.add('active');
    });
  });
  
  console.log("✅ ERP Finance Dashboard initialized successfully");
});
