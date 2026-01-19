let currentEditId = null;
const API_URL = 'http://localhost:5000/api';

// Navbar navigation
document.querySelectorAll('.menu-link').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const page = e.target.closest('a').getAttribute('data-page');
    showPage(page);
    document.querySelectorAll('.menu-link').forEach(l => l.classList.remove('active'));
    e.target.closest('a').classList.add('active');
  });
});

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
    'invoices': 'Invoice Management',
    'reports': 'Financial Reports',
    'audit': 'Activity Log',
    'settings': 'System Settings'
  };
  document.getElementById('pageTitle').textContent = titles[page] || 'Finance Module';

  if (page === 'invoices') loadInvoices();
  if (page === 'audit') loadActivityLog();
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

// Load data on page load
document.addEventListener("DOMContentLoaded", function() {
  loadFinancialSummary();
  loadActivityLog();
  loadTrialBalance();
});

// Close modal when clicking outside
window.onclick = function(event) {
  const modal = document.getElementById("editModal");
  if (event.target === modal) {
    closeEditModal();
  }
}
