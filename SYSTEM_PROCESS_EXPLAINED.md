# 📚 Complete System Process - Step by Step

## Part 1: System Architecture Overview

### What is This System?
An **ERP Finance Module** for managing financial transactions with a **dual-role approval workflow**:
- **Accountants** create and submit journal entries
- **Finance Managers** review, approve, or reject those entries
- **All transactions** are tracked with complete audit trail

---

## Part 2: The Two User Roles

### 👤 Role 1: ACCOUNTANT
**Responsibility**: Create and submit financial transactions

**Permissions**:
- ✅ Create draft journal entries
- ✅ Edit draft entries (not yet submitted)
- ✅ Delete draft entries
- ✅ Submit entries for approval
- ✅ View their submitted entries
- ✅ Attach supporting documents
- ✅ Create bank reconciliation
- ✅ Add discrepancies to reconciliation

**Restrictions**:
- ❌ Cannot approve entries
- ❌ Cannot see pending approvals
- ❌ Cannot view finance dashboard
- ❌ Cannot edit after submission

### 👔 Role 2: FINANCE MANAGER
**Responsibility**: Review and approve financial transactions

**Permissions**:
- ✅ View all pending entries awaiting approval
- ✅ Approve entries with optional comments
- ✅ Reject entries with mandatory reasons
- ✅ View real-time KPI dashboard
- ✅ Monitor approval metrics
- ✅ See pending amounts and approval rates
- ✅ View entry details before approving

**Restrictions**:
- ❌ Cannot create entries
- ❌ Cannot submit entries
- ❌ Cannot edit anything

---

## Part 3: Complete Journal Entry Workflow

### Step 1️⃣: ACCOUNTANT CREATES DRAFT ENTRY

**Location**: Journal Entries tab → Create Journal Entry section

**Process**:
```
Accountant fills form:
├─ Period: 2024-01 (YYYY-MM format)
├─ Account: 1000 (Chart of Accounts)
├─ Debit: 5000.00
├─ Credit: 0.00
└─ Description: Customer payment received

Clicks: "Save as Draft" button
```

**What Happens Behind Scenes**:
```
Frontend (app.js)
  ↓
createJournalEntry() function triggered
  ↓
Validates input:
  ├─ Period format check (YYYY-MM)
  ├─ Account not empty
  └─ Either debit OR credit > 0
  ↓
Creates payload:
{
  period: "2024-01",
  account: "1000",
  debit: 5000,
  credit: 0,
  description: "Customer payment received",
  comments: ""
}
  ↓
Sends HTTP POST to Backend
Headers: {
  "user-id": "accountant-001",
  "Content-Type": "application/json"
}
  ↓
Backend (journal.routes.js - POST /journals)
  ├─ Receives request
  ├─ Extracts user-id from header → "accountant-001"
  ├─ Validates fields
  ├─ Sets status = "DRAFT" (automatically)
  ├─ Saves to MongoDB
  └─ Returns entry with ID
  ↓
Frontend receives response
  ├─ Shows success message "✓ Journal entry saved as draft!"
  ├─ Clears form fields
  ├─ Reloads draft entries table
  └─ Hides message after 3 seconds
```

**Database Entry Created**:
```
Collection: journals
Document: {
  _id: ObjectId("65abc123..."),
  period: "2024-01",
  account: "1000",
  debit: 5000,
  credit: 0,
  description: "Customer payment received",
  comments: "",
  status: "DRAFT",                    ← Status set by backend
  submittedBy: null,
  submittedAt: null,
  approvedBy: null,
  approvedAt: null,
  createdAt: ISODate("2024-01-20T10:00:00Z"),
  updatedAt: ISODate("2024-01-20T10:00:00Z")
}
```

**Result in UI**:
- Entry appears in "Draft Entries" table
- Shows: Period, Account, Debit, Credit, Status (DRAFT in yellow)
- Buttons available: Edit, Submit, Delete

---

### Step 2️⃣: ACCOUNTANT CAN EDIT OR SUBMIT

#### Option A: Edit Draft Entry

**User Action**:
```
In Draft Entries table
Click: "Edit" button
```

**Process**:
```
Frontend (editJournalEntry function)
  ↓
Fetch entry details: GET /api/journals/{entryId}
  ↓
Load data into form:
  ├─ Period input: 2024-01
  ├─ Account input: 1000
  ├─ Debit input: 5000
  ├─ Credit input: 0
  └─ Description input: Customer payment received
  ↓
Set currentEditId = entryId (track which entry)
  ↓
Show success message "Edit mode - Update the entry and save"
  ↓
User modifies fields
  ↓
User clicks "Save as Draft" again
  ↓
Backend receives PUT /api/journals/{entryId}
  ├─ Validates status === "DRAFT"
  ├─ Updates all fields
  ├─ Saves to database
  └─ Returns updated entry
  ↓
Frontend shows "✓ Journal entry updated!"
```

**Important**: Only DRAFT entries can be edited. Once submitted, editing is blocked.

#### Option B: Submit Entry for Approval

**User Action**:
```
In Draft Entries table
Click: "Submit" button
Confirmation: "Submit this journal entry for approval?" → OK
```

**Process**:
```
Frontend (submitJournalEntryById function)
  ↓
POST to /api/journals/{entryId}/submit
Headers: {
  "user-id": "accountant-001"
}
  ↓
Backend (journal.routes.js - POST /:id/submit)
  ├─ Finds entry by ID
  ├─ Validates status === "DRAFT"
  ├─ Changes status to "SUBMITTED"
  ├─ Sets submittedBy = "accountant-001"
  ├─ Sets submittedAt = now()
  └─ Saves to database
  ↓
Database Updated:
{
  status: "SUBMITTED",              ← Changed from DRAFT
  submittedBy: "accountant-001",    ← Who submitted
  submittedAt: ISODate("2024-01-20T10:30:00Z")  ← When
}
  ↓
Frontend
  ├─ Shows alert "Journal entry submitted for approval!"
  ├─ Reloads draft entries (should be empty now)
  ├─ Reloads submitted entries (entry appears here)
  └─ Entry removed from Draft table
```

**Result in UI**:
- Entry moves from "Draft Entries" table to "Submitted Entries" table
- Status changes to "SUBMITTED" (blue badge)
- Only button available: "View" (can't edit or delete anymore)
- Entry now visible to Finance Manager

---

### Step 3️⃣: FINANCE MANAGER REVIEWS PENDING ENTRIES

**Location**: Dashboard tab → Pending Journal Entry Approvals section

**What Manager Sees**:
```
Automatic Load When Opening Dashboard:
  ↓
Frontend calls loadPendingApprovals()
  ↓
GET /api/approvals/journal/pending
Headers: {
  "user-id": "manager-001"
}
  ↓
Backend finds all entries with status = "SUBMITTED"
  ├─ Fields included:
  │  ├─ period, account, debit, credit
  │  ├─ description
  │  ├─ submittedBy (populated: username, email)
  │  ├─ submittedAt
  │  └─ attachments
  └─ Returns array of entries
  ↓
Frontend builds table:
  ├─ Column 1: Period
  ├─ Column 2: Account
  ├─ Column 3: Debit ($)
  ├─ Column 4: Credit ($)
  ├─ Column 5: Description
  ├─ Column 6: Submitted (date)
  ├─ Column 7: Submitted By (accountant name)
  └─ Column 8: Actions (3 buttons)
```

**Table Display**:
```
┌─────────┬─────────┬────────┬────────┬──────────┬────────────┬────────────┬──────────┐
│ Period  │ Account │ Debit  │ Credit │ Descrip. │ Submitted  │ Submitted  │ Actions  │
├─────────┼─────────┼────────┼────────┼──────────┼────────────┼────────────┼──────────┤
│ 2024-01 │ 1000    │ 5000   │ 0      │ Customer │ 2024-01-20 │ Accountant │ [✓][✗][👁]│
│ 2024-01 │ 2000    │ 0      │ 3000   │ Vendor   │ 2024-01-20 │ Accountant │ [✓][✗][👁]│
└─────────┴─────────┴────────┴────────┴──────────┴────────────┴────────────┴──────────┘

Buttons Meaning:
✓ = Approve
✗ = Reject  
👁 = View Details
```

---

### Step 4️⃣: FINANCE MANAGER APPROVES OR REJECTS

#### Option A: APPROVE ENTRY

**Manager Action**:
```
Click: "Approve" (green button)
```

**Process**:
```
Frontend (approveJournalEntry function)
  ↓
Prompt: "Enter approval comments (optional):"
Manager types: "Approved - supporting documents verified"
  ↓
Click: OK
  ↓
POST to /api/approvals/journal/{entryId}/approve
Body: {
  reviewerComments: "Approved - supporting documents verified"
}
Headers: {
  "user-id": "manager-001"
}
  ↓
Backend (approval.routes.js - POST /journal/:id/approve)
  ├─ Finds entry
  ├─ Validates status === "SUBMITTED"
  ├─ Updates:
  │  ├─ status = "APPROVED"
  │  ├─ approvedBy = "manager-001"
  │  ├─ approvedAt = now()
  │  └─ reviewerComments = "Approved - supporting..."
  └─ Saves to database
  ↓
Database Updated:
{
  status: "APPROVED",
  approvedBy: "manager-001",
  approvedAt: ISODate("2024-01-20T11:00:00Z"),
  reviewerComments: "Approved - supporting documents verified"
}
  ↓
Frontend
  ├─ Shows: "Journal entry approved successfully!"
  ├─ Calls loadPendingApprovals() → refreshes table
  ├─ Calls loadDashboardKPIs() → updates metrics
  └─ Entry disappears from pending table
```

**Metrics Updated**:
```
Before Approval:
  Pending Approvals: 5
  Approved Entries: 28
  Approval Rate: 47%

After Approval:
  Pending Approvals: 4    ← Decreased
  Approved Entries: 29    ← Increased
  Approval Rate: 49%      ← Recalculated
```

#### Option B: REJECT ENTRY

**Manager Action**:
```
Click: "Reject" (red button)
```

**Process**:
```
Frontend (rejectJournalEntry function)
  ↓
Prompt: "Enter rejection reason (required):"
Manager types: "Missing vendor invoice - resubmit with document"
  ↓
Click: OK
  ↓
POST to /api/approvals/journal/{entryId}/reject
Body: {
  reviewerComments: "Missing vendor invoice - resubmit with document"
}
Headers: {
  "user-id": "manager-001"
}
  ↓
Backend (approval.routes.js - POST /journal/:id/reject)
  ├─ Finds entry
  ├─ Validates status === "SUBMITTED"
  ├─ Changes status back to "DRAFT"
  ├─ Stores rejection reason in reviewerComments
  ├─ Clears submittedAt and submittedBy
  └─ Saves to database
  ↓
Database Updated:
{
  status: "DRAFT",          ← Back to draft
  submittedBy: null,        ← Cleared
  submittedAt: null,        ← Cleared
  reviewerComments: "Missing vendor invoice - resubmit with document"
}
  ↓
Frontend
  ├─ Shows: "Journal entry rejected and returned to draft"
  ├─ Refreshes pending table (entry gone)
  ├─ Accountant can now see it in Draft Entries again
  └─ Accountant can edit and resubmit
```

**What Accountant Sees Next**:
```
When Accountant opens Journal Entries tab:
  ├─ Rejected entry appears back in "Draft Entries"
  ├─ Can see rejection reason in reviews
  ├─ Can edit the entry
  ├─ Can add missing documents
  └─ Can resubmit
```

---

## Part 4: FINANCE MANAGER DASHBOARD & KPIs

### KPI Metrics Explained

**What Are KPIs?**
Key Performance Indicators - metrics that show the health of the approval workflow

**The 4 Main KPI Cards**:

#### 1. Pending Approvals
```
Shows: Number of journal entries waiting for approval
Calculated: COUNT(entries WHERE status = "SUBMITTED")
Example: 5 entries pending review
Updates: When entry is approved/rejected
Color: Purple gradient
```

#### 2. Pending Amount
```
Shows: Total dollar value of entries awaiting approval
Calculated: SUM(debit + credit) for status = "SUBMITTED"
Example: $45,230.50 pending review
Updates: When entry is approved/rejected
Color: Red/Pink gradient
Note: Important for managers to see financial impact
```

#### 3. Approval Rate
```
Shows: Percentage of entries that have been approved
Calculated: (approved / total) * 100
Example: 47% approval rate
Formula: 
  Total = submitted + approved + posted + draft
  Rate = (approved / total) * 100
Updates: After any status change
Color: Cyan gradient
```

#### 4. Approved Entries
```
Shows: Number of entries successfully approved
Calculated: COUNT(entries WHERE status = "APPROVED")
Example: 28 entries approved
Updates: When entry is approved
Color: Green gradient
```

**Secondary Status Cards** (Below main KPIs):
```
┌──────────┬──────────┬────────┬───────┐
│ Submitted│ Approved │ Posted │ Draft │
│    5     │    28    │   15   │  12   │
└──────────┴──────────┴────────┴───────┘

Shows breakdown of all entries by status
Helps manager understand workflow distribution
```

### How KPIs Are Calculated

**Process**:
```
Every time dashboard loads or entry status changes:
  ↓
Frontend calls: loadDashboardKPIs()
  ↓
GET /api/approvals/statistics
Headers: {
  "user-id": "manager-001"
}
  ↓
Backend (approval.routes.js - GET /statistics)
  ├─ Queries MongoDB:
  │  ├─ Count SUBMITTED: db.journals.countDocuments({status:"SUBMITTED"})
  │  ├─ Count APPROVED: db.journals.countDocuments({status:"APPROVED"})
  │  ├─ Count POSTED: db.journals.countDocuments({status:"POSTED"})
  │  └─ Count DRAFT: db.journals.countDocuments({status:"DRAFT"})
  │
  ├─ Calculates derived metrics:
  │  ├─ pendingAmount = SUM of debit+credit for SUBMITTED entries
  │  ├─ approvalRate = (approved / total) * 100
  │  └─ pendingApprovals = count of SUBMITTED
  │
  └─ Returns JSON:
  {
    journalEntries: {
      submitted: 5,
      approved: 28,
      posted: 15,
      draft: 12,
      total: 60
    },
    metrics: {
      pendingAmount: 45230.50,
      approvalRate: 47,
      pendingApprovals: 5
    }
  }
  ↓
Frontend receives and renders:
  ├─ Creates 4 large gradient cards
  ├─ Creates 4 secondary status cards
  ├─ Updates with live data
  └─ Displays on dashboard
```

---

## Part 5: BANK RECONCILIATION WORKFLOW

### What is Bank Reconciliation?
Accountants verify that the bank statement matches the company's accounting records.

### Step 1: Accountant Creates Reconciliation

**Location**: Bank Reconciliation tab → Create Bank Reconciliation

**Form Fields**:
```
Period:            2024-01
Bank Balance:      50,000.00  (from bank statement)
Book Balance:      47,500.00  (from company records)
Bank Date:         2024-01-20
Notes:             Monthly reconciliation
```

**Process**:
```
Accountant fills form → Clicks "Create Reconciliation"
  ↓
Frontend (createBankReconciliation function)
  ↓
Payload:
{
  period: "2024-01",
  bankStatement: {
    balance: 50000,
    date: "2024-01-20"
  },
  bookBalance: 47500,
  notes: "Monthly reconciliation"
}
  ↓
POST /api/reconciliations
Headers: {
  "user-id": "accountant-001"
}
  ↓
Backend creates document with status: "DRAFT"
  ↓
Database:
{
  _id: ObjectId("65def456..."),
  period: "2024-01",
  bankStatement: {
    balance: 50000,
    date: ISODate("2024-01-20")
  },
  bookBalance: 47500,
  status: "DRAFT",
  discrepancies: [],        ← No discrepancies yet
  submittedBy: null,
  attachments: []
}
  ↓
Frontend
  ├─ Shows success: "✓ Bank reconciliation created!"
  ├─ Shows "Discrepancies" section
  └─ Ready to add discrepancies
```

### Step 2: Add Discrepancies

**Why?** The bank balance doesn't match book balance. Need to explain the difference.

**Common Discrepancies**:
- Outstanding checks (written but not yet cleared)
- Undeposited funds (received but not yet processed)
- Bank charges/fees
- Interest income
- Errors

**Process**:
```
Discrepancies Form Appears:
├─ Type: Outstanding Check
├─ Description: Check #1001 pending
├─ Amount: $2,500

Click: "Add Discrepancy"
  ↓
POST /api/reconciliations/{reconId}/discrepancies
Body:
{
  type: "OUTSTANDING_CHECK",
  description: "Check #1001 pending",
  amount: 2500
}
  ↓
Backend
  ├─ Finds reconciliation
  ├─ Adds to discrepancies array
  ├─ Saves to database
  └─ Returns success
  ↓
Database Updated:
{
  discrepancies: [
    {
      type: "OUTSTANDING_CHECK",
      description: "Check #1001 pending",
      amount: 2500,
      resolvedAt: null        ← Not resolved yet
    }
  ]
}
  ↓
Accountant can add more discrepancies
```

### Step 3: Resolve Discrepancies

**Process**:
```
Each discrepancy is resolved by:
├─ Creating journal entry to record it, OR
├─ Linking to existing journal entry, OR
└─ Manually marking resolved

When resolved:
  ├─ discrepancy.resolvedAt = now()
  └─ discrepancy.journalEntryId = entry ID (if linked)
```

### Step 4: Submit Reconciliation

**Important**: Cannot submit if unresolved discrepancies exist

**Process**:
```
After all discrepancies resolved:
  ↓
Click: "Submit Reconciliation"
  ↓
Validation:
  ├─ Check status === "DRAFT"
  ├─ Check all discrepancies have resolvedAt set
  └─ If unresolved: Error "Cannot submit: X unresolved discrepancies"
  ↓
If valid:
  ├─ POST /api/reconciliations/{reconId}/submit
  ├─ Backend sets:
  │  ├─ status = "SUBMITTED"
  │  ├─ submittedBy = "accountant-001"
  │  └─ submittedAt = now()
  └─ Database updated
  ↓
Frontend
  ├─ Shows: "Bank reconciliation submitted!"
  ├─ Discrepancies section hidden
  └─ Reconciliation appears in "Submitted" list
```

---

## Part 6: DATA FLOW & API COMMUNICATION

### Complete HTTP Request Flow

**Example: Create Journal Entry**

```
┌────────────────────────────────────────────────────────────┐
│                     BROWSER (Frontend)                     │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  User fills form & clicks "Save as Draft"                │
│           ↓                                               │
│  JavaScript calls: createJournalEntry()                  │
│           ↓                                               │
│  Validates input:                                        │
│  - Period format (YYYY-MM)                              │
│  - Account not empty                                    │
│  - Debit or Credit > 0                                 │
│           ↓                                               │
│  Creates Payload:                                        │
│  {                                                       │
│    period: "2024-01",                                   │
│    account: "1000",                                     │
│    debit: 5000,                                         │
│    credit: 0,                                           │
│    description: "...",                                  │
│    comments: ""                                         │
│  }                                                       │
│           ↓                                               │
│  HTTP POST REQUEST                                       │
│  URL: http://localhost:5000/api/journals                │
│  Headers: {                                              │
│    "user-id": "accountant-001",                         │
│    "Content-Type": "application/json"                   │
│  }                                                       │
│                                                            │
└────────────────────────────────────────────────────────────┘
                           ↓
                    NETWORK (HTTP)
                           ↓
┌────────────────────────────────────────────────────────────┐
│                  NODE.JS BACKEND SERVER                    │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Express receives POST request                           │
│           ↓                                               │
│  Router matches: POST /api/journals                      │
│           ↓                                               │
│  journal.routes.js handler executes:                     │
│  router.post("/", async (req, res) => {                │
│    // Line 235-280 in journal.routes.js                │
│           ↓                                               │
│  Extracts data from req.body:                           │
│  - account, debit, credit, period, description, comments│
│           ↓                                               │
│  Extracts user from req.headers["user-id"]             │
│           ↓                                               │
│  Validation:                                             │
│  - if (!account || !period) return 400 error            │
│  - if (!/^\d{4}-\d{2}$/.test(period)) return 400        │
│  - if (debit === 0 && credit === 0) return 400          │
│           ↓                                               │
│  Creates JournalEntry object:                           │
│  {                                                       │
│    account: "1000",                                     │
│    debit: 5000,                                         │
│    credit: 0,                                           │
│    period: "2024-01",                                   │
│    description: "...",                                  │
│    comments: "",                                        │
│    status: "DRAFT",        ← Automatically set         │
│    submittedBy: null,      ← Will be set on submit     │
│    submittedAt: null                                   │
│  }                                                       │
│           ↓                                               │
│  MongoDB Mongoose validates schema                       │
│           ↓                                               │
│  entry.save()              ← Saves to database          │
│           ↓                                               │
│  HTTP RESPONSE                                           │
│  Status: 201 Created                                     │
│  Body: {                                                 │
│    message: "Journal entry created successfully",       │
│    entry: {                                              │
│      _id: "65abc123...",                                │
│      period: "2024-01",                                 │
│      account: "1000",                                   │
│      ... all fields ...                                 │
│      createdAt: "2024-01-20T10:00:00Z"                 │
│    }                                                     │
│  }                                                       │
│                                                            │
└────────────────────────────────────────────────────────────┘
                           ↓
                    NETWORK (HTTP)
                           ↓
┌────────────────────────────────────────────────────────────┐
│                     BROWSER (Frontend)                     │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  .then(res => res.json())                                │
│           ↓                                               │
│  .then(data => {                                         │
│    document.getElementById("journalSuccess").textContent │
│      = "✓ Journal entry saved as draft!";               │
│           ↓                                               │
│    clearJournalForm();    ← Empty all form fields       │
│           ↓                                               │
│    loadDraftJournalEntries();  ← Reload table           │
│           ↓                                               │
│    setTimeout(() => {                                   │
│      hide success message after 3 seconds               │
│    }, 3000);                                            │
│  })                                                       │
│           ↓                                               │
│  Catch error:                                            │
│    .catch(err => {                                       │
│      show error message                                 │
│    });                                                   │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## Part 7: DATABASE SCHEMA & DATA MODEL

### Collection: journals

```javascript
{
  _id: ObjectId,                    // Auto-generated unique ID
  
  // Entry Details
  period: String,                   // "2024-01" (YYYY-MM)
  account: String,                  // "1000" (Chart of Accounts)
  debit: Number,                    // Amount
  credit: Number,                   // Amount
  description: String,              // "Customer payment"
  comments: String,                 // Accountant comments
  
  // Workflow Status
  status: String,                   // DRAFT → SUBMITTED → APPROVED → POSTED
  
  // Submission Info
  submittedBy: String,              // "accountant-001"
  submittedAt: Date,                // When submitted
  
  // Approval Info
  approvedBy: String,               // "manager-001"
  approvedAt: Date,                 // When approved
  reviewerComments: String,         // Manager's comments
  
  // Supporting Documents
  attachments: [ObjectId],          // References to DocumentAttachment
  
  // Invoice Link
  invoiceId: ObjectId,              // Reference to Invoice (optional)
  
  // Timestamps (auto-added by Mongoose)
  createdAt: Date,                  // When created
  updatedAt: Date                   // Last modification
}
```

### Collection: bankreconciliations

```javascript
{
  _id: ObjectId,
  
  period: String,                   // "2024-01"
  
  bankStatement: {
    date: Date,                     // Date of bank statement
    balance: Number                 // Bank balance
  },
  
  bookBalance: Number,              // Company's balance
  
  discrepancies: [
    {
      type: String,                 // OUTSTANDING_CHECK, UNDEPOSITED_FUNDS, etc.
      description: String,          // Details
      amount: Number,               // Difference amount
      journalEntryId: ObjectId,    // Link to journal entry if resolved
      resolvedAt: Date              // When resolved
    }
  ],
  
  status: String,                   // DRAFT, SUBMITTED, APPROVED, CLOSED
  
  submittedBy: String,              // Accountant ID
  submittedAt: Date,
  
  approvedBy: String,               // Manager ID
  approvedAt: Date,
  
  attachments: [
    {
      fileName: String,
      fileType: String,
      fileSize: Number,
      filePath: String,
      uploadedAt: Date
    }
  ],
  
  createdAt: Date,
  updatedAt: Date
}
```

---

## Part 8: STATUS TRANSITIONS (State Machine)

### Journal Entry Status Flow

```
                    DRAFT
                    ├─ User edits
                    │  └─ Stays DRAFT
                    │
                    └─ Click "Submit"
                       ↓
                    SUBMITTED
                    ├─ Manager views
                    │
                    ├─ Manager clicks "Approve"
                    │  └─ Becomes APPROVED
                    │
                    └─ Manager clicks "Reject"
                       └─ Back to DRAFT
                          (Accountant can edit & resubmit)
                          ↓
                       SUBMITTED (after resubmit)
                          ↓
                    APPROVED
                    └─ Auto-post or manual posting
                       ↓
                    POSTED
                    └─ Final - locked
```

### Valid Transitions

```
DRAFT → DRAFT          (edit & save)
DRAFT → SUBMITTED      (click submit)
SUBMITTED → APPROVED   (manager approves)
SUBMITTED → DRAFT      (manager rejects)
APPROVED → POSTED      (posting process)

Invalid (blocked):
SUBMITTED → DRAFT      (edit button disabled)
POSTED → *             (cannot change)
APPROVED → SUBMITTED   (cannot revert)
```

---

## Part 9: REAL-TIME UPDATES

### How Dashboard Stays Updated

**Method 1: Manual Refresh**
```
User clicks "Refresh" button
  ↓
loadDashboardKPIs() called
  ↓
GET /api/approvals/statistics
  ↓
Fresh data from database
  ↓
Metrics update on screen
```

**Method 2: Automatic on Approval**
```
Manager approves entry
  ↓
approveJournalEntry() function:
  │
  ├─ POST /approvals/journal/{id}/approve  (update entry)
  │  ↓
  │  Backend saves status=APPROVED
  │
  ├─ loadPendingApprovals()                 (refresh table)
  │  ↓
  │  Pending table updates (entry disappears)
  │
  └─ loadDashboardKPIs()                    (refresh metrics)
     ↓
     KPI cards update:
     - Pending Approvals: 5 → 4
     - Approved Entries: 28 → 29
     - Approval Rate: 47% → 49%
```

**Note**: NO WebSocket or real-time push
- System uses polling (fetch on demand)
- Updates happen when:
  - User manually clicks refresh
  - User performs action (approve/reject)
  - Page loads

---

## Part 10: USER AUTHENTICATION & SECURITY

### How User Identity Works

**Header-Based Authentication**:
```
Every API request includes:
Headers: {
  "user-id": "accountant-001"    or    "manager-001"
}

Backend uses this to:
├─ Track who created entry
├─ Track who submitted
├─ Track who approved
└─ Restrict access (e.g., manager can't create entries)
```

**How It Works**:
```
Frontend app.js:
├─ Hard-coded user for testing:
│  ├─ Accountant: "accountant-001"
│  └─ Manager: "manager-001"
└─ Sent with every fetch request:
   ```javascript
   fetch(url, {
     headers: {
       "user-id": "accountant-001"
     }
   })
   ```

Backend journal.routes.js:
├─ Extracts from header:
│  ```javascript
│  const userId = req.headers["user-id"]
│  ```
└─ Stores with transaction:
   ```javascript
   entry.submittedBy = userId
   ```
```

**⚠️ Important**: For production:
- Replace header-based auth with JWT tokens
- Implement proper user login
- Store session securely
- Add role-based access control

---

## Part 11: ERROR HANDLING

### Common Error Responses

```
❌ 400 Bad Request
   Cause: Invalid input
   Examples:
   - Period format wrong (not YYYY-MM)
   - Missing required fields
   - Debit and Credit both 0
   
   Response:
   {
     "error": "Invalid period format. Use YYYY-MM"
   }

❌ 401 Unauthorized
   Cause: Missing user ID header
   
   Response:
   {
     "error": "User ID required"
   }

❌ 404 Not Found
   Cause: Entry doesn't exist
   
   Response:
   {
     "error": "Journal entry not found"
   }

❌ 500 Internal Server Error
   Cause: Unexpected server error
   
   Response:
   {
     "error": "Failed to create journal entry",
     "details": "..." (error message)
   }
```

### Frontend Error Handling

```javascript
fetch(url)
  .then(res => res.json())
  .then(data => {
    // Success case
    show success message
  })
  .catch(err => {
    // Network error or JSON parse error
    console.error(err)
    show "Error creating entry"
  })
```

---

## Part 12: COMPLETE SYSTEM FLOW SUMMARY

### High-Level Process

```
1. ACCOUNTANT CREATES
   └─→ Journal Entry (Draft)

2. ACCOUNTANT SUBMITS
   └─→ Journal Entry (Submitted)
       └─→ Visible to Manager

3. MANAGER REVIEWS
   └─→ Dashboard sees:
       - 4 KPI cards
       - Pending Approvals table
       - Metrics in real-time

4. MANAGER DECIDES
   ├─→ APPROVE
   │  └─→ Journal Entry (Approved)
   │      └─→ KPIs update
   │
   └─→ REJECT
      └─→ Journal Entry (Draft again)
          └─→ Back to Accountant
              └─→ Can edit & resubmit

5. FINAL STATE
   └─→ Entry is APPROVED
       └─→ Ready for posting
           └─→ Becomes POSTED (ledger)
```

---

## Part 13: KEY FEATURES SUMMARY

| Feature | Who | What | When |
|---------|-----|------|------|
| Create Entry | Accountant | Draft journal entry | Anytime |
| Edit Entry | Accountant | Modify DRAFT only | Before submit |
| Submit | Accountant | Send for approval | Ready to review |
| View Pending | Manager | See submitted entries | Dashboard open |
| Approve | Manager | Accept with comments | Review complete |
| Reject | Manager | Return with reason | Issues found |
| View KPIs | Manager | Real-time metrics | Dashboard open |
| View Details | Manager | Entry info | Before approve |
| Attach Docs | Accountant | Upload files | Anytime |
| Reconcile | Accountant | Match bank records | Monthly |

---

## Part 14: TECHNOLOGY STACK

```
FRONTEND:
├─ HTML/CSS/JavaScript (Vanilla, no frameworks)
├─ fetch() API for HTTP calls
├─ DOM manipulation for UI updates
└─ localStorage for temporary data

BACKEND:
├─ Node.js runtime
├─ Express framework
├─ Mongoose ODM
├─ MongoDB database
└─ CORS enabled for cross-origin requests

DATABASE:
├─ MongoDB (NoSQL)
├─ Collections: journals, reconciliations, etc.
└─ Indexes on status, period for fast queries

SERVER:
├─ Port 5000 for API
├─ Static files served from /frontend
└─ CORS allows frontend requests
```

---

## Summary

This ERP Finance system is a **workflow management platform** that:

1. **Captures** financial transactions (journal entries)
2. **Routes** them for approval with status tracking
3. **Displays** real-time KPI metrics for managers
4. **Enforces** approval workflow (draft → submitted → approved)
5. **Tracks** all actions with complete audit trail
6. **Manages** reconciliation between bank and books

The key innovation is the **dual-role separation**:
- Accountants create and submit
- Managers review and approve
- Clear separation of duties
- Complete traceability

Everything is connected through **RESTful APIs** with **stateless HTTP communication** and **MongoDB persistence**.
