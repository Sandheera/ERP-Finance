# Accountant Module - API Testing Guide

## API Base URL
```
http://localhost:5000/api
```

## Required Headers
```
Content-Type: application/json
user-id: accountant-001
```

## Journal Entry Endpoints

### 1. Create Draft Journal Entry
```
POST /journals
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

Response (201 Created):
{
  "message": "Journal entry created successfully",
  "entry": {
    "_id": "6789abc...",
    "period": "2024-01",
    "account": "1000-Cash",
    "debit": 500,
    "credit": 0,
    "status": "DRAFT",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### 2. Get Draft Journal Entries
```
GET /journals/accountant/drafts?period=2024-01
Content-Type: application/json
user-id: accountant-001

Response (200 OK):
{
  "count": 2,
  "entries": [
    {
      "_id": "6789abc...",
      "period": "2024-01",
      "account": "1000-Cash",
      "debit": 500,
      "credit": 0,
      "status": "DRAFT",
      "description": "Cash receipt from customer",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### 3. Get Submitted Journal Entries
```
GET /journals/accountant/submitted?period=2024-01
Content-Type: application/json

Response (200 OK):
{
  "count": 1,
  "entries": [
    {
      "_id": "6789abc...",
      "period": "2024-01",
      "account": "1000-Accounts Receivable",
      "debit": 1000,
      "credit": 0,
      "status": "SUBMITTED",
      "submittedAt": "2024-01-15T14:20:00Z",
      "submittedBy": {
        "_id": "accountant-001",
        "username": "John Accountant"
      }
    }
  ]
}
```

### 4. Submit Journal Entry for Approval
```
POST /journals/6789abc.../submit
Content-Type: application/json
user-id: accountant-001

Response (200 OK):
{
  "message": "Entry submitted for approval",
  "entry": {
    "_id": "6789abc...",
    "status": "SUBMITTED",
    "submittedAt": "2024-01-15T15:00:00Z",
    "submittedBy": "accountant-001"
  }
}
```

### 5. Update Draft Journal Entry
```
PUT /journals/6789abc...
Content-Type: application/json
user-id: accountant-001

{
  "debit": 600,
  "description": "Updated: Cash receipt from customer (adjusted)"
}

Response (200 OK):
{
  "message": "Journal entry updated successfully",
  "entry": {
    "_id": "6789abc...",
    "debit": 600,
    "status": "DRAFT",
    "updatedAt": "2024-01-15T15:15:00Z"
  }
}
```

### 6. Delete Draft Journal Entry
```
DELETE /journals/6789abc...
Content-Type: application/json

Response (200 OK):
{
  "message": "Journal entry deleted successfully",
  "deletedId": "6789abc..."
}
```

### 7. Attach Document to Journal Entry
```
POST /journals/6789abc.../attach
Content-Type: application/json
user-id: accountant-001

{
  "fileName": "receipt_123.pdf",
  "fileType": "PDF",
  "fileSize": 245000,
  "description": "Customer receipt for cash payment",
  "category": "RECEIPT"
}

Response (201 Created):
{
  "message": "Document attached successfully",
  "attachment": {
    "_id": "attach-001",
    "fileName": "receipt_123.pdf",
    "fileType": "PDF",
    "uploadedBy": "accountant-001",
    "uploadedAt": "2024-01-15T15:30:00Z"
  },
  "entry": {
    "_id": "6789abc...",
    "attachments": ["attach-001"]
  }
}
```

### 8. View Journal Entry with Attachments
```
GET /journals/6789abc.../with-attachments
Content-Type: application/json

Response (200 OK):
{
  "_id": "6789abc...",
  "period": "2024-01",
  "account": "1000-Cash",
  "debit": 500,
  "credit": 0,
  "status": "DRAFT",
  "description": "Cash receipt from customer",
  "attachments": [
    {
      "_id": "attach-001",
      "fileName": "receipt_123.pdf",
      "fileType": "PDF",
      "description": "Customer receipt for cash payment",
      "uploadedAt": "2024-01-15T15:30:00Z"
    }
  ],
  "submittedBy": null,
  "createdAt": "2024-01-15T10:30:00Z"
}
```

## Bank Reconciliation Endpoints

### 1. Create Bank Reconciliation
```
POST /reconciliations
Content-Type: application/json
user-id: accountant-001

{
  "period": "2024-01",
  "bankBalance": 50000,
  "bookBalance": 49500,
  "bankDate": "2024-01-31",
  "bankFileName": "Bank_Statement_Jan_2024.pdf",
  "notes": "End of month reconciliation"
}

Response (201 Created):
{
  "message": "Bank reconciliation created",
  "reconciliation": {
    "_id": "recon-001",
    "period": "2024-01",
    "bankStatement": {
      "balance": 50000,
      "date": "2024-01-31",
      "fileName": "Bank_Statement_Jan_2024.pdf"
    },
    "bookBalance": 49500,
    "status": "DRAFT",
    "discrepancies": [],
    "createdAt": "2024-01-31T10:00:00Z"
  }
}
```

### 2. Get Reconciliation by Period
```
GET /reconciliations/period/2024-01
Content-Type: application/json

Response (200 OK):
{
  "_id": "recon-001",
  "period": "2024-01",
  "bankStatement": {
    "balance": 50000,
    "date": "2024-01-31"
  },
  "bookBalance": 49500,
  "status": "DRAFT",
  "discrepancies": [],
  "attachments": []
}
```

### 3. List Draft Reconciliations
```
GET /reconciliations/drafts/list
Content-Type: application/json

Response (200 OK):
{
  "count": 2,
  "reconciliations": [
    {
      "_id": "recon-001",
      "period": "2024-01",
      "bankStatement": {
        "balance": 50000
      },
      "bookBalance": 49500,
      "status": "DRAFT",
      "createdAt": "2024-01-31T10:00:00Z"
    }
  ]
}
```

### 4. Add Discrepancy
```
POST /reconciliations/recon-001/discrepancies
Content-Type: application/json

{
  "type": "OUTSTANDING_CHECK",
  "description": "Check #12345 not yet cleared by bank",
  "amount": 500,
  "journalEntryId": null
}

Response (201 Created):
{
  "message": "Discrepancy added",
  "reconciliation": {
    "_id": "recon-001",
    "discrepancies": [
      {
        "_id": "disc-001",
        "type": "OUTSTANDING_CHECK",
        "description": "Check #12345 not yet cleared by bank",
        "amount": 500,
        "resolvedAt": null
      }
    ]
  }
}
```

### 5. Resolve Discrepancy
```
PUT /reconciliations/recon-001/discrepancies/disc-001/resolve
Content-Type: application/json

{
  "journalEntryId": "journal-001"
}

Response (200 OK):
{
  "message": "Discrepancy resolved",
  "reconciliation": {
    "_id": "recon-001",
    "discrepancies": [
      {
        "_id": "disc-001",
        "type": "OUTSTANDING_CHECK",
        "resolvedAt": "2024-01-31T14:00:00Z",
        "journalEntryId": "journal-001"
      }
    ]
  }
}
```

### 6. Get Reconciliation Status
```
GET /reconciliations/recon-001/status
Content-Type: application/json

Response (200 OK):
{
  "bankBalance": 50000,
  "bookBalance": 49500,
  "difference": 500,
  "unresolvedCount": 1,
  "totalDiscrepancies": 1,
  "isReconciled": false
}
```

### 7. Update Book Balance
```
PUT /reconciliations/recon-001/book-balance
Content-Type: application/json

{
  "balance": 50000
}

Response (200 OK):
{
  "message": "Book balance updated",
  "reconciliation": {
    "_id": "recon-001",
    "bookBalance": 50000
  }
}
```

### 8. Submit Reconciliation
```
POST /reconciliations/recon-001/submit
Content-Type: application/json
user-id: accountant-001

Response (200 OK):
{
  "message": "Reconciliation submitted for approval",
  "reconciliation": {
    "_id": "recon-001",
    "status": "SUBMITTED",
    "submittedAt": "2024-01-31T15:00:00Z",
    "submittedBy": "accountant-001"
  }
}
```

### 9. Attach Document to Reconciliation
```
POST /reconciliations/recon-001/attach
Content-Type: application/json
user-id: accountant-001

{
  "fileName": "bank_statement_jan_2024.pdf",
  "fileType": "PDF",
  "fileSize": 512000,
  "description": "Official bank statement for January 2024",
  "category": "BANK_STATEMENT"
}

Response (201 Created):
{
  "message": "Document attached successfully",
  "attachment": {
    "_id": "attach-002",
    "fileName": "bank_statement_jan_2024.pdf",
    "fileType": "PDF",
    "uploadedAt": "2024-01-31T15:30:00Z"
  },
  "reconciliation": {
    "_id": "recon-001",
    "attachments": ["attach-002"]
  }
}
```

### 10. View Reconciliation with Attachments
```
GET /reconciliations/recon-001/with-attachments
Content-Type: application/json

Response (200 OK):
{
  "_id": "recon-001",
  "period": "2024-01",
  "bankStatement": {
    "balance": 50000,
    "date": "2024-01-31",
    "fileName": "Bank_Statement_Jan_2024.pdf"
  },
  "bookBalance": 50000,
  "status": "DRAFT",
  "discrepancies": [
    {
      "_id": "disc-001",
      "type": "OUTSTANDING_CHECK",
      "description": "Check #12345",
      "amount": 500,
      "resolvedAt": "2024-01-31T14:00:00Z"
    }
  ],
  "attachments": [
    {
      "_id": "attach-002",
      "fileName": "bank_statement_jan_2024.pdf",
      "fileType": "PDF",
      "description": "Official bank statement",
      "uploadedAt": "2024-01-31T15:30:00Z"
    }
  ],
  "submittedAt": null,
  "createdAt": "2024-01-31T10:00:00Z"
}
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Missing required fields: period, bankBalance, bookBalance"
}
```

### 401 Unauthorized
```json
{
  "error": "User ID required"
}
```

### 403 Forbidden
```json
{
  "error": "Cannot delete journal entry linked to an invoice"
}
```

### 404 Not Found
```json
{
  "error": "Journal entry not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to create journal entry",
  "details": "Error message details"
}
```

## Testing Sequence

### Complete Workflow Test
1. Create draft journal entry
2. View draft entries list
3. Update draft entry
4. Attach document to entry
5. View entry with attachments
6. Submit entry for approval
7. View submitted entries
8. Create bank reconciliation
9. Add discrepancies
10. View reconciliation status
11. Resolve discrepancies
12. Update book balance
13. Submit reconciliation
14. Attach document to reconciliation
15. View reconciliation with attachments

## curl Examples

### Create Draft Journal Entry
```bash
curl -X POST http://localhost:5000/api/journals \
  -H "Content-Type: application/json" \
  -H "user-id: accountant-001" \
  -d '{
    "period": "2024-01",
    "account": "1000-Cash",
    "debit": 500,
    "credit": 0,
    "description": "Cash receipt",
    "comments": "Customer payment"
  }'
```

### Submit Journal Entry
```bash
curl -X POST http://localhost:5000/api/journals/6789abc.../submit \
  -H "Content-Type: application/json" \
  -H "user-id: accountant-001"
```

### Create Reconciliation
```bash
curl -X POST http://localhost:5000/api/reconciliations \
  -H "Content-Type: application/json" \
  -H "user-id: accountant-001" \
  -d '{
    "period": "2024-01",
    "bankBalance": 50000,
    "bookBalance": 49500,
    "notes": "Month-end reconciliation"
  }'
```

### Add Discrepancy
```bash
curl -X POST http://localhost:5000/api/reconciliations/recon-001/discrepancies \
  -H "Content-Type: application/json" \
  -d '{
    "type": "OUTSTANDING_CHECK",
    "description": "Check #12345",
    "amount": 500
  }'
```

## Postman Import

You can import these endpoints into Postman using the collection URL or JSON file. Create a new collection and add the endpoints above as individual requests.

---

**Last Updated**: January 2026
