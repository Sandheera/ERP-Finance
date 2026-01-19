# Accountant Module - Quick Start Guide

## Installation & Setup

### Prerequisites
- Node.js installed
- MongoDB running on localhost:27017
- Backend server running on port 5000
- Frontend running on any HTTP server

### Start Backend
```bash
cd backend
npm install
npm start
```

### Start Frontend
```bash
# Using Python HTTP server (or any HTTP server)
cd frontend
python -m http.server 8000
# Open http://localhost:8000 in browser
```

## Accountant Workflow

### Step 1: Create a Journal Entry (Draft)
1. Click **Journal Entries** in navigation
2. Fill in the form:
   - Period: Select month (e.g., 2024-01)
   - Account: Enter account code (e.g., 1000-Cash)
   - Debit: Enter amount (or 0)
   - Credit: Enter amount (or 0)
   - Description: What is this for?
   - Comments: Any additional notes
3. Click **Save Draft** (entry saved for later editing)

### Step 2: Submit Journal Entry for Approval
1. Find your draft entry in "Draft Journal Entries" table
2. Click **Submit** button
3. Entry moves to "Submitted Journal Entries"
4. Finance Manager will review and approve

### Step 3: Create Bank Reconciliation
1. Click **Bank Reconciliation** in navigation
2. Fill in the form:
   - Period: Select month
   - Bank Balance: Amount from bank statement
   - Book Balance: Amount from accounting books
   - Bank Date: Date of bank statement
   - Notes: Any relevant notes
3. Click **Create Reconciliation**

### Step 4: Add Discrepancies
1. Click **Add Discrepancy** in the reconciliation
2. Select discrepancy type:
   - Outstanding Check: Check written but not cleared
   - Undeposited Funds: Deposit in transit
   - Bank Charge: Bank fees
   - Interest: Interest earned/charged
   - Error: Accounting or bank error
3. Enter description and amount
4. Click **Add Discrepancy**
5. Repeat for each discrepancy

### Step 5: Resolve All Discrepancies
Once all discrepancies are identified:
1. Review each discrepancy
2. Take corrective action (create journal entry if needed)
3. Mark as resolved
4. Ensure Bank Balance = Book Balance

### Step 6: Submit Reconciliation
1. Click **Submit** button
2. System verifies:
   - All discrepancies resolved
   - Balances match
3. Reconciliation submitted for approval
4. Finance Manager will review and approve

## Key Features

### Journal Entries
- ✅ Create multiple draft entries
- ✅ Edit entries before submission
- ✅ Delete unwanted entries
- ✅ Submit for approval
- ✅ Attach supporting documents
- ✅ Add comments for reviewer

### Bank Reconciliation
- ✅ Create reconciliation for any period
- ✅ Identify and track discrepancies
- ✅ Categorize discrepancy types
- ✅ Link to journal entries
- ✅ Calculate remaining balance difference
- ✅ Attach bank statements
- ✅ Submit when complete

### Document Management
- ✅ Attach PDFs, images, spreadsheets
- ✅ Organize by category
- ✅ Track upload date and uploader
- ✅ View all attachments with entries

## Common Tasks

### Add a Receipt to Journal Entry
1. Create/open a journal entry
2. Scroll to attachments section
3. Click **Add Document**
4. Select file type and upload
5. Add description (e.g., "Customer Invoice")

### Fix a Discrepancy
1. Identify what's wrong (e.g., uncleared check)
2. Create a journal entry if needed to adjust
3. Click **Resolve** on the discrepancy
4. Optionally link the journal entry

### Review Entry Before Submitting
1. Click **View** to see full entry details
2. Review all information
3. Check attached documents
4. Click **Submit** when ready

## Status Meanings

### Journal Entry Status
- **DRAFT**: You can edit or delete
- **SUBMITTED**: Waiting for Finance Manager approval
- **APPROVED**: Entry has been approved
- **POSTED**: Entry is in the financial records

### Reconciliation Status
- **DRAFT**: You can add/modify discrepancies
- **SUBMITTED**: Waiting for approval
- **APPROVED**: Reconciliation approved
- **CLOSED**: Reconciliation completed for the period

## Tips & Best Practices

1. **Use clear descriptions**: Help reviewers understand the entry purpose
2. **Attach supporting docs**: Include receipts, invoices, bank statements
3. **Review before submitting**: Double-check amounts and accounts
4. **Add comments**: Explain any unusual or complex entries
5. **Reconcile monthly**: Don't let discrepancies pile up
6. **Document discrepancies**: Be specific about what doesn't match
7. **Link entries**: Connect discrepancies to journal entries that resolve them

## Common Issues & Solutions

### Problem: "Either debit or credit must be greater than 0"
**Solution**: Enter a value in either Debit or Credit field (not both zero)

### Problem: "Debit and credit amounts don't balance"
**Solution**: For a balanced entry, debit must equal credit

### Problem: "Can only submit when all discrepancies resolved"
**Solution**: Resolve each discrepancy or create balancing entries

### Problem: Can't delete submitted entry
**Solution**: Submitted entries are locked. Contact your Finance Manager.

### Problem: Can't find entry in submitted list
**Solution**: It may have been approved. Check with your Finance Manager.

## Period Format

Always use **YYYY-MM** format for periods:
- ✅ Correct: 2024-01, 2024-12
- ❌ Wrong: 01-2024, 2024/01, Jan 2024

## Contact Support

If you encounter issues:
1. Check that both frontend and backend are running
2. Open browser developer console (F12) for error messages
3. Check backend console for API errors
4. Verify MongoDB is running
5. Contact your IT/Finance Manager for assistance

---

**Happy accounting!** 📊
