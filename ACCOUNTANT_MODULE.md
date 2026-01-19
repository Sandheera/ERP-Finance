# Accountant Module - Implementation Guide

## Overview
The Accountant module provides comprehensive tools for creating and managing journal entries and bank reconciliation. This is a complete implementation of the accountant workflow for the ERP Finance system.

## Features Implemented

### 1. **Journal Entry Management**

#### Create Journal Entry (Draft)
- **Endpoint**: `POST /api/journals`
- **Status**: Draft entries saved for later editing
- **Fields**: 
  - Period (YYYY-MM format)
  - Account number/name
  - Debit amount
  - Credit amount
  - Description
  - Comments
- **Frontend**: Journal Entries page > Create Journal Entry section

#### Submit Journal Entry
- **Endpoint**: `POST /api/journals/:id/submit`
- **Status**: Changes entry from DRAFT to SUBMITTED
- **Requirements**: 
  - Entry must be in DRAFT status
  - Debit and Credit must balance
  - User ID required in headers
- **Workflow**: Accountant submits → Finance Manager approves/rejects

#### View Draft Entries
- **Endpoint**: `GET /api/journals/accountant/drafts`
- **Query Params**: 
  - `period`: Optional YYYY-MM filter
- **Response**: List of draft entries created by the current user
- **Frontend**: Journal Entries page > Draft Journal Entries table

#### View Submitted Entries
- **Endpoint**: `GET /api/journals/accountant/submitted`
- **Query Params**: 
  - `period`: Optional YYYY-MM filter
- **Response**: List of submitted entries awaiting approval
- **Frontend**: Journal Entries page > Submitted Journal Entries table

#### Update Draft Entry
- **Endpoint**: `PUT /api/journals/:id`
- **Status**: Can only update DRAFT entries
- **Fields**: Any of the entry fields (period, account, debit, credit, description, comments)
- **Response**: Updated entry object

#### Delete Draft Entry
- **Endpoint**: `DELETE /api/journals/:id`
- **Status**: Only DRAFT entries can be deleted
- **Protection**: Entries linked to invoices cannot be deleted
- **Audit Trail**: Deletion is tracked in audit logs

#### Attach Documents
- **Endpoint**: `POST /api/journals/:id/attach`
- **Supported Types**: PDF, JPG, PNG, XLSX, XLS, DOC, DOCX, TXT, CSV
- **Fields**:
  - fileName (required)
  - fileType (required)
  - fileSize
  - description
  - category (RECEIPT, INVOICE, APPROVAL, EVIDENCE, OTHER)
- **Response**: Attachment details and updated entry

#### View Entry with Attachments
- **Endpoint**: `GET /api/journals/:id/with-attachments`
- **Response**: Complete entry with all populated references (attachments, user info, etc.)

### 2. **Bank Reconciliation**

#### Create Reconciliation
- **Endpoint**: `POST /api/reconciliations`
- **Fields**:
  - period (YYYY-MM format, required)
  - bankBalance (required)
  - bookBalance (required)
  - bankDate (optional, defaults to today)
  - bankFileName (optional)
  - notes (optional)
- **Status**: Created as DRAFT
- **Response**: New reconciliation object
- **Frontend**: Bank Reconciliation page > Create Bank Reconciliation section

#### Get Reconciliation by Period
- **Endpoint**: `GET /api/reconciliations/period/:period`
- **Returns**: Complete reconciliation data for a specific period
- **Includes**: Discrepancies, attachments, user info

#### List Draft Reconciliations
- **Endpoint**: `GET /api/reconciliations/drafts/list`
- **Returns**: All draft reconciliations for review
- **Frontend**: Bank Reconciliation page > Reconciliations table

#### Add Discrepancy
- **Endpoint**: `POST /api/reconciliations/:id/discrepancies`
- **Discrepancy Types**:
  - `OUTSTANDING_CHECK`: Checks written but not cleared
  - `UNDEPOSITED_FUNDS`: Deposits in transit
  - `BANK_CHARGE`: Bank fees/charges
  - `INTEREST`: Interest earned/charged
  - `ERROR`: Accounting/bank errors
- **Fields**:
  - type (required, must be one of above)
  - description (required)
  - amount (required)
  - journalEntryId (optional, for reconciling items)
- **Response**: Updated reconciliation with new discrepancy

#### Resolve Discrepancy
- **Endpoint**: `PUT /api/reconciliations/:id/discrepancies/:discrepancyId/resolve`
- **Action**: Marks discrepancy as resolved
- **Optional**: Link a journal entry to the discrepancy
- **Response**: Updated reconciliation

#### Get Reconciliation Status
- **Endpoint**: `GET /api/reconciliations/:id/status`
- **Returns**:
  - Bank balance
  - Book balance
  - Difference amount
  - Count of unresolved discrepancies
  - Total discrepancies count
  - Reconciliation status (boolean)
- **Reconciled**: True when difference is $0 and all discrepancies resolved

#### Update Book Balance
- **Endpoint**: `PUT /api/reconciliations/:id/book-balance`
- **Field**: balance (required)
- **Status**: Only DRAFT reconciliations can be updated
- **Use Case**: Correct book balance after adjustments

#### Submit Reconciliation
- **Endpoint**: `POST /api/reconciliations/:id/submit`
- **Preconditions**:
  - Must be in DRAFT status
  - All discrepancies must be resolved
  - Bank balance must equal book balance
- **Status Change**: DRAFT → SUBMITTED
- **Response**: Success message with updated reconciliation

#### Attach Documents to Reconciliation
- **Endpoint**: `POST /api/reconciliations/:id/attach`
- **Use Case**: Attach bank statements, supporting documents
- **Same as journal attachments**: filename, type, size, category
- **Response**: Attachment details

#### View Reconciliation with Attachments
- **Endpoint**: `GET /api/reconciliations/:id/with-attachments`
- **Returns**: Complete reconciliation with all populated references

## Data Models

### Journal Entry Model
```javascript
{
  description: String,
  lines: [{account, debit, credit}],
  period: String,           // YYYY-MM format
  account: String,
  debit: Number,
  credit: Number,
  invoiceId: ObjectId,      // Optional reference
  status: String,           // DRAFT, SUBMITTED, APPROVED, POSTED
  submittedBy: ObjectId,    // User ID
  submittedAt: Date,
  approvedBy: ObjectId,     // Finance Manager
  approvedAt: Date,
  attachments: [ObjectId],
  comments: String,
  reviewerComments: String
}
```

### Bank Reconciliation Model
```javascript
{
  period: String,           // YYYY-MM format
  bankStatement: {
    date: Date,
    balance: Number,
    fileName: String,
    uploadedAt: Date
  },
  bookBalance: Number,
  discrepancies: [{
    type: String,           // OUTSTANDING_CHECK, UNDEPOSITED_FUNDS, etc.
    description: String,
    amount: Number,
    journalEntryId: ObjectId,
    resolvedAt: Date
  }],
  status: String,           // DRAFT, SUBMITTED, APPROVED, CLOSED
  submittedBy: ObjectId,
  submittedAt: Date,
  approvedBy: ObjectId,
  approvedAt: Date,
  attachments: [ObjectId],
  comments: String,
  reconciliationNotes: String
}
```

### Document Attachment Model
```javascript
{
  referenceType: String,    // JOURNAL_ENTRY, BANK_RECONCILIATION, INVOICE, EXPENSE
  referenceId: ObjectId,
  fileName: String,
  fileType: String,         // PDF, JPG, PNG, XLSX, etc.
  fileSize: Number,
  filePath: String,
  uploadedBy: ObjectId,     // User ID
  uploadedAt: Date,
  description: String,
  category: String          // RECEIPT, INVOICE, BANK_STATEMENT, etc.
}
```

## Frontend Pages

### Journal Entries Page
- **URL**: Click "Journal Entries" in navigation
- **Sections**:
  1. **Create Journal Entry Form**
     - Period selector
     - Account input
     - Debit/Credit fields
     - Description textarea
     - Comments textarea
     - Save Draft and Submit buttons

  2. **Draft Journal Entries Table**
     - Shows all draft entries
     - Actions: Edit, Submit, Delete

  3. **Submitted Journal Entries Table**
     - Shows all submitted entries awaiting approval
     - Read-only view
     - Status and submission date displayed

### Bank Reconciliation Page
- **URL**: Click "Bank Reconciliation" in navigation
- **Sections**:
  1. **Create Bank Reconciliation Form**
     - Period selector
     - Bank Balance input
     - Book Balance input
     - Bank Statement Date
     - Notes textarea
     - Create button

  2. **Reconciliations Table**
     - Shows all draft reconciliations
     - Displays difference between bank and book balance
     - Actions: View, Add Discrepancy, Submit

  3. **Discrepancies Section** (appears after creating reconciliation)
     - Discrepancy Type dropdown
     - Description input
     - Amount input
     - Add Discrepancy button
     - List of added discrepancies

## API Usage Examples

### Create Draft Journal Entry
```javascript
POST /api/journals
Content-Type: application/json
user-id: accountant-001

{
  "period": "2024-01",
  "account": "1000-Cash",
  "debit": 500,
  "credit": 0,
  "description": "Cash receipt from customer",
  "comments": "Customer payment for Invoice #123"
}
```

### Submit Journal Entry
```javascript
POST /api/journals/[entryId]/submit
Content-Type: application/json
user-id: accountant-001
```

### Create Bank Reconciliation
```javascript
POST /api/reconciliations
Content-Type: application/json
user-id: accountant-001

{
  "period": "2024-01",
  "bankBalance": 50000,
  "bookBalance": 49500,
  "bankDate": "2024-01-31",
  "notes": "End of month reconciliation"
}
```

### Add Discrepancy
```javascript
POST /api/reconciliations/[reconId]/discrepancies
Content-Type: application/json

{
  "type": "OUTSTANDING_CHECK",
  "description": "Check #12345 not yet cleared",
  "amount": 500
}
```

## Workflow

### Journal Entry Workflow
1. **Accountant creates entry in DRAFT status**
   - Uses Create Journal Entry form
   - Can edit/delete anytime while in DRAFT

2. **Accountant submits entry**
   - Status changes to SUBMITTED
   - Finance Manager is notified
   - Entry becomes read-only

3. **Finance Manager approves/rejects**
   - If approved: status → POSTED
   - If rejected: status → DRAFT (sent back with comments)

4. **Posting**
   - POSTED entries are used in financial reports
   - Cannot be edited after posting

### Bank Reconciliation Workflow
1. **Accountant creates reconciliation in DRAFT status**
   - Enters bank and book balances
   - Can edit/update balances

2. **Accountant identifies discrepancies**
   - Adds each discrepancy type
   - Can link to journal entries for resolution

3. **Resolve all discrepancies**
   - Balances must match
   - All discrepancies resolved

4. **Accountant submits reconciliation**
   - Status → SUBMITTED
   - Finance Manager reviews and approves
   - Status → APPROVED/CLOSED

## Security Considerations

### User Authentication
- User ID passed in headers (`user-id`)
- TODO: Implement JWT authentication for production

### Authorization
- Draft entries only visible to creator (currently)
- Submitted entries visible to managers
- Role-based access control should be implemented

### Data Integrity
- Debit and credit must balance before submission
- Cannot delete entries linked to invoices
- Audit trail tracks all changes

## Testing Checklist

- [ ] Create draft journal entry
- [ ] Edit draft journal entry
- [ ] Submit journal entry
- [ ] Delete draft journal entry
- [ ] View submitted entries
- [ ] Create bank reconciliation
- [ ] Add discrepancies to reconciliation
- [ ] Resolve discrepancies
- [ ] Submit reconciliation
- [ ] Attach documents to journal entry
- [ ] Attach documents to reconciliation
- [ ] View entry/reconciliation with attachments
- [ ] Test balance validation
- [ ] Test period format validation
- [ ] Test status workflow transitions

## Future Enhancements

1. **Multi-line entries**: Support journal entries with multiple debit/credit lines
2. **Batch uploads**: Import transactions from CSV/Excel
3. **Real-time collaboration**: Multiple accountants working on same reconciliation
4. **Mobile app**: Native mobile app for on-the-go entry creation
5. **Integration**: Connect with bank APIs for automatic statement imports
6. **Advanced reporting**: Reconciliation history, variance analysis
7. **Approval workflows**: Custom routing and approval hierarchies
8. **Comments system**: Threading comments on entries and reconciliations
9. **Attachment storage**: Integration with cloud storage (S3, etc.)
10. **Advanced audit**: Detailed audit trails with before/after values

## Support

For issues or questions about the accountant module:
1. Check the API endpoints above
2. Review the frontend code in `frontend/js/app.js`
3. Check backend services in `backend/services/`
4. Review models in `backend/models/`
