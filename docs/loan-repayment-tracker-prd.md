# Loan Repayment Tracker — Product Requirements Document

**Version:** 0.4
**Status:** Draft

---

## What we're building

A borrower-facing web module added to an existing project. It reads live data from a Google Sheet that the admin maintains. The admin's entire workflow stays in Google Sheets — they never interact with the app. Borrowers visit a URL, log in with their phone number and loan ID, and see their repayment status.

---

## The core idea

Google Sheets is the source of truth. Always. The app reads from it on a schedule and never writes back to it. When the admin updates a payment in the sheet, the app reflects it on the next sync.

---

## Google Sheets structure

The app connects to the spreadsheet via the Sheets API using a service account with **read-only** access. The admin shares the sheet once with the service account email and never thinks about it again.

**Loans tab** (one row per borrower)

| Field | Notes |
|---|---|
| `loan_id` | L001, L002 … used as part of borrower login |
| `business_name` | Borrower entity name |
| `contact_person` | Primary contact name |
| `email` | Contact email |
| `phone` | Used as part of borrower login — normalised on read |
| `equipment_financed` | Free text description of asset |
| `facility_size_ngn` | Principal amount |
| `mgmt_fee_ngn` | 1% of facility |
| `insurance_cost_ngn` | 2% of facility |
| `interest_terms` | Text e.g. "14% over 6 months" |
| `interest_amount_ngn` | Interest in Naira |
| `tenure` | Loan duration |
| `moratorium` | Usually 0 |
| `monthly_repayment` | Number or descriptive text |
| `total_repayable_ngn` | Lifetime total |
| `disbursement_date` | |
| `delivery_date` | |
| `final_repayment_date` | |

**Installments tab** (one row per scheduled payment)

| Field | Notes |
|---|---|
| `installment_id` | I0001, I0002 … |
| `loan_id` | Links to Loans tab |
| `installment_no` | 1, 2, 3 … |
| `due_date` | Scheduled payment date |
| `amount_due_ngn` | Amount due for this installment |
| `repayment_log` | "Received Payment" or "Not Due" |
| `payment_date` | Actual date paid — blank if unpaid |

Status is derived by the app at runtime. There is no status column in the sheet.

---

## Data sync

The app polls the Google Sheet every 15 minutes and caches the result in memory. It also exposes a protected endpoint — `yourapp.com/sync?key=XXXX` — that the admin can bookmark and hit for an immediate refresh after logging a payment.

The key is set as an environment variable. No login page is needed for this.

---

## Borrower authentication

Two fields:

- **Phone number** — as registered in the sheet
- **Loan ID** — e.g. `L001`, communicated to the borrower at disbursement by their financing officer

The app normalises both values before comparing against the sheet. If both match a row in the Loans tab, the session is authenticated for that loan.

**Phone normalisation** (the sheet has inconsistent formatting):

- Strip all spaces, dashes, and brackets
- `08063738170` → `+2348063738170`
- `8063738170` → `+2348063738170`
- `+2348063738170` → unchanged
- `2348063738170` → `+2348063738170`

Loan ID matching is case-insensitive (`l001` = `L001`).

No account creation. No password reset. The loan ID is the PIN. If a borrower loses their loan ID, they contact their financing officer.

If one phone number is linked to multiple loan IDs, the borrower must log in separately for each. They are not combined into one view.

---

## Borrower-facing screens

### 1. Login screen

Two fields: phone number and loan ID. A brief line of context: *"Enter the phone number and loan ID provided by your financing officer."*

### 2. Loan status screen

Shown after successful authentication. The borrower can only see the loan that matched their credentials.

Display:

- Business name and equipment financed
- Overall account status badge — see status ladder below
- Next payment: amount due + due date + days remaining or days overdue
- Full installment schedule: due date, amount, status, payment date for each row
- Summary figures: total repayable, total paid to date, outstanding balance

### 3. Not found screen

*"We couldn't find a loan matching those details. Please check your loan ID or contact your financing officer."*

---

## Status logic

Calculated by the app at runtime. The admin does not maintain a status field in the sheet.

| Status | Badge colour | Condition |
|---|---|---|
| Not yet due | Gray | Due date is in the future, no payment recorded |
| On track | Green | No overdue payments |
| Late | Amber | No payment, 1–4 days past due date |
| Account at Risk | Red | No payment, 5+ days past due date |
| Paid | Green | `payment_date` is populated |

The account-level badge reflects the worst active installment status. One unpaid installment 5+ days overdue makes the whole account **Account at Risk**, even if other installments are on track.

The thresholds — 1 day for Late, 5 days for Account at Risk — are set as environment variables so they can be adjusted without a code change.

---

## SMS alerts

All borrowers are on Nigerian numbers. SMS is delivered via the **Dojah API**. Numbers are formatted to `+234` before sending.

### Alert escalation

Alerts escalate as the account moves through thresholds. Each alert fires once when its threshold is first crossed — it does not repeat daily. If an account moves directly from On track to Account at Risk (e.g. the daily job did not catch the Late window), only the Account at Risk message fires.

| Trigger | Message |
|---|---|
| 3 days before due date | "Hello [Name], your equipment financing repayment of ₦[amount] is due on [date]. Please ensure funds are ready." |
| Due date reached, unpaid | "Hello [Name], your payment of ₦[amount] is due today. Pay now to keep your account in good standing." |
| Late threshold crossed (default: 1 day) | "Hello [Name], your payment of ₦[amount] is now [X] day(s) overdue. Please pay immediately to avoid your account being flagged at risk." |
| Account at Risk threshold crossed (default: 5 days) | "Hello [Name], your account is now at risk. Your payment of ₦[amount] is [X] days overdue. Please contact your financing officer immediately." |

### Deduplication

A sent-log keyed on `installment_id` + alert type prevents the same alert firing twice for the same installment. The log resets if a payment is made and a new installment enters a threshold window.

### Alert job

A background job runs once daily at 8am. It reads the current installment data, checks each unpaid installment against the threshold conditions, and fires any alerts not yet sent for that installment.

### Environment variables

```
ALERT_LATE_DAYS=1
ALERT_AT_RISK_DAYS=5
DOJAH_API_KEY=xxx
DOJAH_SENDER_ID=xxx
SYNC_ENDPOINT_KEY=xxx
```

---

## Admin experience

The admin has no login and no app interface. Their full workflow:

- **Add a borrower:** add a row to the Loans tab and their installment rows to the Installments tab
- **Log a payment:** enter the `payment_date` in the relevant installment row
- **Immediate refresh:** hit the bookmarked sync URL after updating the sheet
- **Adjust thresholds:** request an environment variable update from whoever manages the deployment

The app is strictly read-only against the sheet.

---

## Data quality handling

Known issues in the current sheet that the app must handle gracefully on import:

| Issue | Handling |
|---|---|
| Phone numbers formatted inconsistently | Normalise to `+234` on read |
| "Recieved Payment" misspelling | Treat as equivalent to "Received Payment" |
| KAYPEE (L003) has varying per-installment amounts | Use `amount_due_ngn` per row — do not fall back to `monthly_repayment` |
| Lavish (L002) has a payment date after the final repayment date | Preserve as-is, log as anomaly, do not crash |
| Empty rows between borrower sections | Skip silently |

---

## Out of scope

- Admin login or app-side admin dashboard
- Writing any data back to Google Sheets
- WhatsApp delivery (SMS only)
- Payment processing or collections
- Borrower ability to update contact details
- Multi-portfolio or multi-lender support

---

## MVP definition

Done when:

- App reads the live Google Sheet via service account on a 15-minute poll
- Borrower logs in with phone number + loan ID
- Loan status and full installment schedule display correctly
- Status logic calculates correctly for all three borrowers in the current sheet
- Phone normalisation handles all formats present in the sheet
- Renders correctly on a mobile browser

SMS alerts and the on-demand sync endpoint ship in the first update after the portal is live and stable.
