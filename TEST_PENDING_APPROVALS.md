# 🧪 Quick Test: Pending Approvals Feature

## Quick Test Checklist

### Before Testing
- ✅ Backend running on http://localhost:5000
- ✅ MongoDB connection verified
- ✅ Browser open to http://localhost:5000

---

## Test: Create & Approve Journal Entry

### Step 1: Create Draft Entry (Accountant)
```
Navigation: Journal Entries tab
Period:      2024-01
Account:     1000
Debit:       5000.00
Credit:      0
Description: Customer Payment
Action:      Click "Save as Draft"
Expected:    Entry appears in "Draft Entries" table
Status:      DRAFT (yellow badge)
```

### Step 2: Submit Entry for Approval (Accountant)
```
Table:       Draft Entries
Action:      Click "Submit" button on draft entry
Confirmation: "Submit this journal entry for approval?" → OK
Expected:    Entry moves to "Submitted Entries" table
Status:      SUBMITTED (blue badge)
Notify:      "Journal entry submitted for approval!"
```

### Step 3: View Pending Approvals (Finance Manager)
```
Navigation:  Dashboard tab
Load:        Page automatically loads KPIs and pending approvals
Expected:    
  - KPI Card "Pending Approvals" shows: 1
  - KPI Card "Pending Amount" shows: $5,000.00
  - Table shows submitted entry with all details
```

### Step 4: Approve Entry (Finance Manager)
```
Table:       Pending Journal Entry Approvals
Row:         Your submitted entry
Action:      Click "Approve" button (green)
Prompt:      "Enter approval comments (optional):"
Input:       "Approved - looks good"
Click:       OK
Expected:    
  - Entry disappears from pending table
  - Alert: "Journal entry approved successfully!"
  - KPI "Pending Approvals" becomes: 0
  - KPI "Approved Entries" increases by 1
  - KPI "Approval Rate" updates percentage
```

### Step 5: Alternative - Reject Entry (Finance Manager)
```
Table:       Pending Journal Entry Approvals
Row:         Your submitted entry (if testing rejection)
Action:      Click "Reject" button (red)
Prompt:      "Enter rejection reason (required):"
Input:       "Need supporting documents"
Click:       OK
Expected:    
  - Entry disappears from pending table
  - Alert: "Journal entry rejected and returned to draft"
  - Entry reappears in Draft Entries (Accountant view)
  - Status back to: DRAFT (yellow)
  - Can now edit and resubmit
```

### Step 6: View Entry Details (Finance Manager)
```
Table:       Pending Journal Entry Approvals
Row:         Your submitted entry
Action:      Click "View" button (blue)
Expected:    Alert showing entry details:
  - Period: 2024-01
  - Account: 1000
  - Debit: 5000.00
  - Credit: 0.00
  - Status: SUBMITTED
  - Description: Customer Payment
  - Submitted By: [Accountant name]
  - Submitted At: [Date/Time]
```

---

## Dashboard KPI Cards Explained

| Card | Shows | Updates When |
|------|-------|--------------|
| **Pending Approvals** | Count of SUBMITTED entries | Entry submitted or approved |
| **Pending Amount** | Total $ value of pending entries | Entry submitted or approved |
| **Approval Rate** | % of approved out of total | Any entry status changes |
| **Approved Entries** | Count of APPROVED entries | Entry approved |

### Status Breakdown Cards
| Card | Shows | Color |
|------|-------|-------|
| **Submitted** | Awaiting approval | Purple |
| **Approved** | Approved but not posted | Green |
| **Posted** | Posted to ledger | Red |
| **Draft** | Saved but not submitted | Orange |

---

## Console Errors (Now Fixed) ✅

### What Was Broken
```
✗ ReferenceError: editJournalEntry is not defined
✗ ReferenceError: showDiscrepanciesSection is not defined  
✗ Error: Failed to create entry
✗ Failed to load resource: 500 (Internal Server Error)
```

### What Was Fixed
```
✅ Added editJournalEntry() function (30 lines)
✅ Added showDiscrepanciesSection() function (31 lines)
✅ Removed invalid status field from payloads
✅ Added missing "user-id" headers to API calls
✅ All functions now properly defined
✅ All API calls match backend expectations
```

---

## Troubleshooting

### Issue: "No pending approvals" when expected to see entry
**Cause**: Entry was just created but might not be submitted yet
**Solution**: 
1. Go to Journal Entries tab
2. Check that entry is in "Submitted Entries" (not "Draft")
3. Go back to Dashboard and refresh
4. If still not showing, check browser console for errors

### Issue: "Error loading pending approvals"
**Cause**: Backend server not running or API endpoint error
**Solution**:
1. Check terminal - is "🚀 Backend running on port 5000" shown?
2. Check terminal - is "✅ MongoDB connected" shown?
3. If not, restart with: `cd backend && npm start`
4. Refresh browser

### Issue: Approve button shows error
**Cause**: User header might be missing or entry status wrong
**Solution**:
1. Check console for specific error message
2. Verify entry status is "SUBMITTED" (not "APPROVED" already)
3. Refresh page and try again

### Issue: Dashboard KPIs show 0 for everything
**Cause**: No journal entries created yet
**Solution**: Create a journal entry following Step 1-2 above

---

## Success Indicators ✨

When everything is working:

✅ Can create draft entries in Journal Entries tab  
✅ Can submit draft entries for approval  
✅ Can see submitted entries in Dashboard pending table  
✅ Can approve entries and see them disappear from pending  
✅ KPI metrics update immediately after approval  
✅ Can reject entries and they return to draft  
✅ Can view entry details before approving  
✅ No console errors shown  

---

## Key Endpoints Being Tested

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| /api/journals | POST | Create draft entry | ✅ Fixed |
| /api/journals/:id/submit | POST | Submit for approval | ✅ Fixed |
| /api/journals/accountant/submitted | GET | List submitted entries | ✅ Fixed |
| /api/approvals/journal/pending | GET | Get pending approvals | ✅ Working |
| /api/approvals/journal/:id/approve | POST | Approve entry | ✅ Working |
| /api/approvals/journal/:id/reject | POST | Reject entry | ✅ Working |
| /api/approvals/statistics | GET | Get KPI metrics | ✅ Working |

---

**Ready to Test!** 🚀 Start with Step 1 above.
