# 🏗️ Complete System Architecture - ERP Finance Module

## System Overview Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                     FRONTEND (Vanilla JavaScript)                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ NAVIGATION MENU                                              │  │
│  │ ├─ Dashboard (Finance Manager - NEW!)                        │  │
│  │ ├─ Journal Entries (Accountant)                              │  │
│  │ ├─ Bank Reconciliation (Accountant)                          │  │
│  │ ├─ Invoices (Shared)                                         │  │
│  │ ├─ Reports (Shared)                                          │  │
│  │ ├─ Audit Log (Admin)                                         │  │
│  │ └─ Settings (Admin)                                          │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ DASHBOARD PAGE (Active by default)                           │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │                                                              │  │
│  │  ┌─────────────┬──────────────┬──────────────┬──────────────┐  │
│  │  │   Pending   │   Pending    │  Approval    │   Approved   │  │
│  │  │ Approvals   │    Amount    │     Rate     │   Entries    │  │
│  │  │     (5)     │    ($45K)    │    (47%)     │     (28)     │  │
│  │  └─────────────┴──────────────┴──────────────┴──────────────┘  │
│  │                                                              │  │
│  │  Status Metrics: [Submitted: 5] [Approved: 28] [Posted: 15] │  │
│  │                   [Draft: 12]                               │  │
│  │                                                              │  │
│  │  ┌─────────────────────────────────────────────────────────┐  │
│  │  │ Pending Journal Entry Approvals                          │  │
│  │  ├─────────────────────────────────────────────────────────┤  │
│  │  │ Period | Account | Debit | Credit | Description | ...  │  │
│  │  │ 2024-01 | 1000   | 1000  | 0     | Customer pmt | ...  │  │
│  │  │ 2024-01 | 2000   | 0     | 500   | Vendor inv  | ...  │  │
│  │  │                                                         │  │
│  │  │ [✓ Approve] [✗ Reject] [👁 View]                       │  │
│  │  └─────────────────────────────────────────────────────────┘  │
│  │                                                              │  │
│  │  Other Sections: [Create Invoice] [Month End Closing]       │  │
│  │                  [Trial Balance]                            │  │
│  │                                                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ JOURNAL ENTRIES PAGE (Accountant)                            │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │ Create Entry Form (Period, Account, Debit, Credit)           │  │
│  │ [Save as Draft]  [Submit]                                    │  │
│  │                                                              │  │
│  │ Draft Entries Table + Edit/Submit/Delete                     │  │
│  │ Submitted Entries Table + View/Attach                        │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ BANK RECONCILIATION PAGE (Accountant)                        │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │ Create Reconciliation Form                                  │  │
│  │ Add Discrepancies Section                                    │  │
│  │ Resolve Discrepancies with Journal Entries                   │  │
│  │ [Submit] [Attach Documents]                                 │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                              ↓ HTTP/JSON
┌─────────────────────────────────────────────────────────────────────┐
│              BACKEND (Node.js/Express on Port 5000)                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ API ROUTES                                                   │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │                                                              │  │
│  │ /api/journals (12 endpoints)                                │  │
│  │  ├─ POST   /                 Create entry                   │  │
│  │  ├─ GET    /                 List all entries                │  │
│  │  ├─ GET    /accountant/drafts        Get draft entries        │  │
│  │  ├─ GET    /accountant/submitted     Get submitted            │  │
│  │  ├─ POST   /:id/submit       Submit for approval             │  │
│  │  ├─ PUT    /:id              Update draft                    │  │
│  │  ├─ DELETE /:id              Delete draft                    │  │
│  │  ├─ POST   /:id/attach       Attach document                │  │
│  │  └─ [more...]                                               │  │
│  │                                                              │  │
│  │ /api/approvals (4 endpoints) ← FINANCE MANAGER              │  │
│  │  ├─ GET    /journal/pending           List pending entries    │  │
│  │  ├─ POST   /journal/:id/approve       Approve with comment    │  │
│  │  ├─ POST   /journal/:id/reject        Reject with reason      │  │
│  │  └─ GET    /statistics                Get KPI metrics         │  │
│  │                                                              │  │
│  │ /api/reconciliations (10 endpoints)                         │  │
│  │  ├─ POST   /                 Create reconciliation           │  │
│  │  ├─ GET    /drafts/list      Get draft reconciliations      │  │
│  │  ├─ POST   /:id/discrepancies         Add discrepancy        │  │
│  │  ├─ PUT    /:id/discrepancies/:did/resolve                  │  │
│  │  └─ [more...]                                               │  │
│  │                                                              │  │
│  │ /api/invoices (Invoice approval routes)                     │  │
│  │                                                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ SERVICES (Business Logic)                                    │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │                                                              │  │
│  │ journalService                                               │  │
│  │ ├─ createDraftEntry()                                       │  │
│  │ ├─ submitEntry()                                            │  │
│  │ ├─ validateBalance()                                        │  │
│  │ └─ attachDocument()                                         │  │
│  │                                                              │  │
│  │ reconciliationService                                        │  │
│  │ ├─ createReconciliation()                                   │  │
│  │ ├─ addDiscrepancy()                                         │  │
│  │ ├─ resolveDiscrepancy()                                     │  │
│  │ └─ submitReconciliation()                                   │  │
│  │                                                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ MODELS (Data Schemas)                                        │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │                                                              │  │
│  │ JournalEntry                                                │  │
│  │ ├─ period, account, debit, credit                           │  │
│  │ ├─ status (DRAFT/SUBMITTED/APPROVED/POSTED)                │  │
│  │ ├─ submittedBy, submittedAt                                │  │
│  │ ├─ approvedBy, approvedAt (← Finance Manager)              │  │
│  │ ├─ comments, reviewerComments (← Finance Manager)          │  │
│  │ └─ attachments[], invoiceId                                │  │
│  │                                                              │  │
│  │ BankReconciliation                                          │  │
│  │ ├─ period, bankBalance, bookBalance                        │  │
│  │ ├─ status (DRAFT/SUBMITTED/APPROVED/RECONCILED)           │  │
│  │ ├─ discrepancies[]                                          │  │
│  │ └─ attachments[]                                            │  │
│  │                                                              │  │
│  │ DocumentAttachment                                          │  │
│  │ ├─ fileName, fileType, fileSize                            │  │
│  │ ├─ referenceType, referenceId                              │  │
│  │ └─ uploadedBy, uploadedAt                                  │  │
│  │                                                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                              ↓ Mongoose/MongoDB
┌─────────────────────────────────────────────────────────────────────┐
│              DATABASE (MongoDB on localhost:27017)                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Collections:                                                      │
│  ├─ journals (entries with approval data)                         │  │
│  ├─ bankreconciliations (reconciliation records)                 │  │
│  ├─ documentattachments (files)                                  │  │
│  ├─ invoices (AR/AP)                                            │  │
│  ├─ users (user data)                                           │  │
│  ├─ chartofaccounts (COA)                                       │  │
│  ├─ periods (fiscal periods)                                    │  │
│  └─ audittrails (logging)                                       │  │
│                                                                     │
│  Sample Journal Entry Document:                                    │
│  {                                                                │  │
│    _id: ObjectId,                                                │  │
│    period: "2024-01",                                            │  │
│    account: "1000",                                              │  │
│    debit: 1000,                                                  │  │
│    credit: 0,                                                    │  │
│    description: "Invoice payment",                               │  │
│    status: "APPROVED",                                           │  │
│    submittedBy: ObjectId("accountant-001"),                      │  │
│    submittedAt: ISODate("2024-01-20T10:30Z"),                   │  │
│    approvedBy: ObjectId("manager-001"),     ← Finance Manager    │  │
│    approvedAt: ISODate("2024-01-20T11:00Z"),← Finance Manager    │  │
│    reviewerComments: "Approved",            ← Finance Manager    │  │
│    attachments: [ObjectId(...)],                                │  │
│    createdAt: ISODate,                                          │  │
│    updatedAt: ISODate                                           │  │
│  }                                                               │  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Complete Workflow Diagram

```
ACCOUNTANT WORKFLOW:
─────────────────────────────────────────────────────────────
1. Access "Journal Entries" menu
                    ↓
2. Fill form: Period, Account, Debit/Credit, Description
                    ↓
3. Click "Save as Draft" → Status: DRAFT
   OR
3. Click "Submit" → Status: SUBMITTED
                    ↓
4. View in Draft/Submitted table
                    ↓
5. If Draft:
   - Can Edit (PUT /:id)
   - Can Delete (DELETE /:id)
   - Can Submit (POST /:id/submit)
                    ↓
6. Once Submitted:
   - Cannot Edit
   - Cannot Delete
   - Awaits Manager Approval
                    ↓
7. Can attach documents (POST /:id/attach)


FINANCE MANAGER WORKFLOW (NEW):
──────────────────────────────────────────────────────────────
1. Access Dashboard (default page)
                    ↓
2. View KPI Metrics (auto-load):
   - Pending Approvals
   - Pending Amount
   - Approval Rate
   - Approved Entries
                    ↓
3. Scroll to "Pending Journal Entry Approvals"
                    ↓
4. See table of SUBMITTED entries:
   - Period, Account, Debit/Credit
   - Description, Submitted Date
   - Submitted By (Accountant name)
                    ↓
5. For each entry, choose:
   
   ┌─ APPROVE (with optional comments):
   │  ├─ Click "Approve" button
   │  ├─ Enter optional comments
   │  ├─ Click OK
   │  └─ Status: SUBMITTED → APPROVED
   │
   ├─ REJECT (with mandatory reason):
   │  ├─ Click "Reject" button
   │  ├─ Enter mandatory reason (required)
   │  ├─ Click OK
   │  └─ Status: SUBMITTED → DRAFT
   │     (Entry returned to accountant for revision)
   │
   └─ VIEW Details:
      ├─ Click "View" button
      ├─ See full entry details
      └─ Then approve/reject
                    ↓
6. After action:
   - KPIs auto-update
   - Pending table refreshes
   - Metrics show new counts
                    ↓
7. Click "Refresh" anytime to update metrics
```

---

## 📊 Data Flow Diagram

```
FRONTEND REQUEST FLOW:
──────────────────────

1. User Action (Click Button)
   └─→ JavaScript Function Triggered
       └─→ fetch() API Call
           └─→ HTTP Request to Backend

2. Manager Approval Flow:
   ┌─ Click "Approve" button
   │
   ├─→ Prompt: "Enter comments?"
   │
   ├─→ fetch(POST /approvals/journal/:id/approve)
   │   Headers: {
   │     "user-id": "manager-001",
   │     "Content-Type": "application/json"
   │   }
   │   Body: {
   │     "reviewerComments": "Optional..."
   │   }
   │
   └─→ Backend Processes Request
       └─→ Database Updates
           └─→ Response Returned
               └─→ Frontend Updates UI
                   ├─ Refresh KPIs
                   ├─ Refresh Pending Table
                   └─ Show Success Alert


BACKEND REQUEST PROCESSING:
───────────────────────────

POST /approvals/journal/:id/approve

1. Validate:
   ├─ user-id header present
   ├─ Entry ID is valid
   └─ Entry status is "SUBMITTED"

2. Update Database:
   ├─ Set status = "APPROVED"
   ├─ Set approvedBy = user-id
   ├─ Set approvedAt = now
   └─ Set reviewerComments = comments

3. Return Response:
   {
     "message": "Journal entry approved successfully",
     "entry": { ...updated entry... }
   }

4. Frontend receives response:
   ├─ Parse JSON
   ├─ Show success alert
   ├─ Refresh loadPendingApprovals()
   ├─ Refresh loadDashboardKPIs()
   └─ Both tables update automatically


DATABASE TRANSACTION:
─────────────────────

1. Find: Journal.findById(id)
2. Verify: Check status === "SUBMITTED"
3. Update: entry.status = "APPROVED"
           entry.approvedBy = userId
           entry.approvedAt = new Date()
4. Save: entry.save()
5. Return: Updated document

All in single transaction for consistency
```

---

## 🎯 Feature Comparison Matrix

| Feature | Accountant | Finance Manager |
|---------|-----------|-----------------|
| View Journal Entries | ✅ Draft/Submitted | ✅ All (Pending) |
| Create Journal Entries | ✅ | ❌ |
| Edit Entries | ✅ (Draft only) | ❌ |
| Delete Entries | ✅ (Draft only) | ❌ |
| Submit for Approval | ✅ | ❌ |
| Approve Entries | ❌ | ✅ |
| Reject Entries | ❌ | ✅ |
| View KPI Dashboard | ❌ | ✅ |
| Monitor Metrics | ❌ | ✅ |
| Add Comments | ❌ | ✅ (on approval) |
| Bank Reconciliation | ✅ | ❌ |
| Attach Documents | ✅ | ❌ |
| View Attachments | ✅ | ✅ |
| Generate Reports | Limited | ✅ |

---

## 🔐 Authentication & Authorization

```
REQUEST → HEADER VALIDATION
                ↓
         user-id: "accountant-001"
         or
         user-id: "manager-001"
                ↓
         ROUTE HANDLER
                ↓
         CHECK PERMISSIONS
         - Can view?
         - Can modify?
         - Can approve?
                ↓
         DATABASE OPERATION
                ↓
         VALIDATE STATUS
         - Is entry in correct state?
         - Can transition to new status?
                ↓
         RESPONSE
```

---

## 📈 API Response Examples

### GET /api/approvals/statistics

```json
{
  "journalEntries": {
    "submitted": 5,
    "approved": 28,
    "posted": 15,
    "draft": 12,
    "total": 60
  },
  "invoices": {
    "pending": 3,
    "approved": 15
  },
  "metrics": {
    "pendingAmount": 45230.50,
    "approvalRate": 47,
    "pendingApprovals": 5
  }
}
```

### GET /api/approvals/journal/pending

```json
{
  "count": 2,
  "entries": [
    {
      "_id": "65abc123...",
      "period": "2024-01",
      "account": "1000",
      "debit": 1000,
      "credit": 0,
      "description": "Customer payment",
      "submittedBy": {
        "username": "accountant-001",
        "email": "accountant@example.com"
      },
      "submittedAt": "2024-01-20T10:30:00Z",
      "attachments": []
    },
    {
      "_id": "65abc456...",
      "period": "2024-01",
      "account": "2000",
      "debit": 0,
      "credit": 500,
      "description": "Vendor invoice",
      "submittedBy": {
        "username": "accountant-001"
      },
      "submittedAt": "2024-01-20T11:15:00Z",
      "attachments": ["doc123"]
    }
  ]
}
```

---

## ✨ System Status Summary

```
┌─────────────────────────────────────────────────────────┐
│ ERP FINANCE MODULE - COMPLETE IMPLEMENTATION           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ACCOUNTANT ROLE:                                       │
│ ✅ Journal Entry Management (12 endpoints)              │
│ ✅ Bank Reconciliation (10 endpoints)                   │
│ ✅ Document Attachment System                           │
│                                                         │
│ FINANCE MANAGER ROLE:                                  │
│ ✅ Dashboard KPIs (4 metrics)                           │
│ ✅ Approval Workflow (4 endpoints)                      │
│ ✅ Entry Approval/Rejection                            │
│ ✅ Real-time Metrics                                    │
│                                                         │
│ SYSTEM FEATURES:                                       │
│ ✅ Role-based Access Control                           │
│ ✅ Complete Audit Trail                                │
│ ✅ Status Validation                                   │
│ ✅ Error Handling                                       │
│ ✅ Real-time Updates                                    │
│                                                         │
│ API ENDPOINTS: 26+ routes                              │
│ DATABASE: MongoDB with 8+ collections                  │
│ FRONTEND: Single-page app with 7 pages                 │
│                                                         │
│ STATUS: 🟢 FULLY OPERATIONAL                           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

**Ready for Deployment!** 🚀
