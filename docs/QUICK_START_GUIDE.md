# Quick Start Guide - Verify Evaluator Dashboard

## **IMMEDIATE TEST (Right Now - No Backend Needed)**

### **Step 1: Start Frontend**
```powershell
cd C:\Desktop\halabarsa1(29.11noon)\aicte-frontend
npm run dev
```

### **Step 2: Open Dashboard**
```
URL: http://localhost:5173/evaluator/dashboard
```

### **Step 3: You Should See**
✅ A loading animation for 5 seconds  
✅ Then "Sample University" appears with mock documents  
✅ Table with "Affidavit 1" and "NOC Document"  
✅ Green "Approve" buttons  
✅ Red "Reject" buttons  

### **Step 4: Test Approve Flow**
1. Click **Approve** button (green, on first document)
2. See confirmation dialog
3. Click **Approve** in dialog
4. ✅ Success message appears: "Affidavit 1 approved successfully!"
5. ✅ Button becomes disabled
6. ✅ Status changes to "Approved"

### **Step 5: Test Reject Flow**
1. Click **Reject** button (red, on second document)
2. See dialog asking for reason
3. Type reason: "Missing signatures"
4. Click **Reject** button
5. ✅ Success message appears: "NOC Document rejected successfully!"
6. ✅ Button becomes disabled
7. ✅ Status changes to "Rejected"

### **Step 6: Test Report Downloads**
1. Click **"View Report"** under Groq Analysis
2. ✅ See analysis metrics (Format Match %, Layout Match %)
3. Click **"Download Groq Report"**
4. ✅ HTML file downloads
5. Repeat for Keyword Analysis

---

## **COMPLETE FLOW TEST (With Backend)**

### **Phase 1: Start All Services**

**Terminal 1 - Backend:**
```powershell
cd C:\Desktop\halabarsa1(29.11noon)\aicte-backend
npm run dev
# Should say "Server running on port 5000"
```

**Terminal 2 - Frontend:**
```powershell
cd C:\Desktop\halabarsa1(29.11noon)\aicte-frontend
npm run dev
# Should say "Local: http://localhost:5173"
```

**Terminal 3 - Python API (if needed):**
```powershell
cd C:\Desktop\halabarsa1(29.11noon)\aicte_models
python -m app.main
# Should say "Application startup complete"
```

### **Phase 2: Institute Submits Application**

1. Open `http://localhost:5173/institute/login`
2. Login with institute credentials
3. Go to `http://localhost:5173/institute/dashboard/application-workspace`
4. Select Application Type
5. Upload 2 PDF documents
6. Fill in Application Name and Description
7. Click **"Submit Application"**
8. ✅ Should see success message or redirect to applications list

### **Phase 3: Check Backend Assignment**

Look in Terminal 1 (backend console):
```
✅ Document uploaded and analyzed
✅ Evaluator assigned
✅ Application created with ID: DOC-2024-XXX
```

### **Phase 4: Evaluator Reviews**

1. Open new browser or incognito window
2. Go to `http://localhost:5173/evaluator/login`
3. Login with evaluator credentials
4. Navigate to `http://localhost:5173/evaluator/dashboard`
5. ✅ Should see the institute that submitted
6. ✅ Should see the documents you uploaded
7. ✅ Groq and Keyword analysis should show percentages

### **Phase 5: Test Approve/Reject**

1. Click **Approve** button
2. Click **Approve** in confirmation dialog
3. ✅ Success message appears
4. Check Terminal 1 for log:
   ```
   Document DOC-2024-XXX approved by evaluator
   ```
5. ✅ Database should be updated

---

## **Verification Checklist**

### **Mock Data Test** (Should Pass in 1 minute)
- [ ] Page loads with mock data
- [ ] "Sample University" header visible
- [ ] 2 documents in table
- [ ] Green "Approve" button clickable
- [ ] Red "Reject" button clickable
- [ ] Success messages appear
- [ ] Download buttons work
- [ ] Buttons disable after action

### **Real Data Test** (After backend ready)
- [ ] Backend receives POST from institute
- [ ] Application created in database
- [ ] Evaluator assigned
- [ ] Evaluator dashboard shows submission
- [ ] Analysis data displays correctly
- [ ] Approve button works
- [ ] Reject button works
- [ ] Database updates with action
- [ ] Data persists on refresh

---

## **Expected Output Examples**

### **Mock Data Page (After 5 seconds)**
```
┌─────────────────────────────────────┐
│        Sample University            │
│ Application ID: DOC-2024-001        │
│ Submission Date: 2024-12-03         │
└─────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ Document Analysis                                   │
├─────────────────────────────────────────────────────┤
│ Name       │ Status    │ Groq │ Keyword │ Actions  │
├─────────────────────────────────────────────────────┤
│ Affidavit  │ Submitted │ View │ View    │ ✅ ❌   │
│ NOC Doc    │ Submitted │ View │ View    │ ✅ ❌   │
└─────────────────────────────────────────────────────┘
```

### **After Clicking Approve**
```
✅ "Affidavit 1 approved successfully!" (Green message)
Button becomes: ❌ (disabled)
Status changes to: [APPROVED] (green badge)
```

### **Console Logs** (F12 → Console)
```
Evaluator data received: {assigned_document: Array(1)}
Successfully approved: Affidavit 1
API response: {status: 200, message: "approved"}
```

---

## **Troubleshooting**

### **Issue: Page still loading after 10 seconds**
**Solution:**
1. Open F12 → Console
2. Look for errors
3. Check if backend is running
4. Refresh page (Ctrl+R)
5. Should fallback to mock data after 5 seconds

### **Issue: Buttons don't respond**
**Solution:**
1. Open F12 → Console
2. Type: `console.log("Test")`
3. Check for JavaScript errors
4. Refresh page
5. Try again

### **Issue: Download button doesn't work**
**Solution:**
1. Check browser download settings
2. Check popup blocker
3. Try different browser
4. Check browser console for errors

### **Issue: Real data not showing**
**Solution:**
1. Check if backend is running
2. Check if institute submitted application
3. Check backend logs for errors
4. Verify API endpoint exists
5. Use Postman to test endpoint manually

---

## **Browser Developer Tools Tips**

### **Check Network Requests**
```
F12 → Network tab → Click on request → Headers
Look for: GET /evaluator/data/data
Should return: 200 status with JSON data
```

### **Check Console Errors**
```
F12 → Console tab
Look for red error messages
Read error carefully and fix accordingly
```

### **Check Local Storage**
```
F12 → Application → Local Storage
Look for: auth token, user info
```

---

## **Success Indicators**

### **You'll Know It's Working When:**
1. ✅ Mock data loads without errors
2. ✅ Approve/Reject buttons respond
3. ✅ Success messages appear
4. ✅ Download buttons work
5. ✅ Console shows no red errors
6. ✅ Real data appears when backend is ready
7. ✅ Database updates when you approve/reject
8. ✅ Status persists on page refresh

---

## **Next Steps**

1. **Start with mock data test** (1 minute)
2. **Test all UI features** (3 minutes)
3. **Start backend** (2 minutes)
4. **Test institute submission** (5 minutes)
5. **Verify evaluator sees submission** (1 minute)
6. **Test approve/reject** (2 minutes)
7. **Verify database update** (1 minute)

**Total Time: ~15 minutes for complete verification**

---

## **Files to Reference**

- `EVALUATION_FLOW_VERIFICATION.md` - Complete workflow explanation
- `BACKEND_API_SPECS.md` - API specifications
- `src/pages/evaluator/index.tsx` - Complete evaluator dashboard code

---

**Status: ✅ READY FOR TESTING**

**Start here:** `http://localhost:5173/evaluator/dashboard`
