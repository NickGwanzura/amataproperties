# Amata Properties Architecture

Amata is designed as a full-service real estate agency platform with a public property marketplace and an internal ERP. The public side drives lead capture, property discovery, viewings, reservations, and buyer confidence. The private side governs inventory, allocations, deposits, installment collections, commissions, documents, audit trails, and executive reporting.

## Business Workflow

1. A visitor searches active developments, inspects pricing, views the GeoJSON stand map, and submits a reservation.
2. The reservation action validates the stand, creates or updates the client, creates a lead, creates a reservation reference, marks the stand as `RESERVED`, records audit history, and queues notifications.
3. An agent can move a qualified buyer into `PRESALE` by assigning a stand and client.
4. Accounts records a physical deposit. Once verified, the reservation becomes a sale, the stand becomes `SOLD`, an installment plan is generated, the commission becomes payable, and sale documents are generated.
5. Installments are collected through Velocity. Reconciliation compares Velocity traces, local payment records, receipt status, and installment balances.
6. CEO and system admin dashboards aggregate sales, inventory, revenue, outstanding balances, conversion, commission liability, and audit activity.

## Permission Architecture

Permissions are role-first and enforced around modules:

- `PUBLIC`: browse public inventory and submit reservations.
- `CLIENT`: view owned stands, balances, receipts, statements, contracts, and highlighted map position.
- `AGENT`: manage leads, clients, reservations, presales, allocations, and own commissions.
- `ACCOUNTS`: verify deposits, record payments, reconcile Velocity transactions, and run aging reports.
- `ADMINISTRATOR`: create developments, upload GeoJSON, manage stands, documents, pricing, and terms.
- `CEO`: read executive dashboards, rankings, revenue, collections, and performance reports.
- `SYSTEM_ADMIN`: manage users, roles, integrations, audit logs, overrides, and impersonation.

## Data Architecture

The Prisma schema models the full lifecycle:

- Developments hold public presentation data, terms, infrastructure status, media, documents, and GeoJSON.
- Stands hold stand number, phase, area, price, geometry, coordinates, notes, and allocation status.
- Clients and leads are separate so marketing qualification can happen before purchase.
- Reservations are the bridge between intent and allocation.
- Sales activate only after verified deposits.
- Installment plans and installment rows provide deterministic balance tracking.
- Payments support physical deposits and Velocity installment transactions.
- Commissions are generated after deposit verification and follow pending, approved, and paid states.
- Notifications and audit logs are first-class records, not side effects hidden in code.

## GIS Workflow

Uploaded GeoJSON is stored at development level, while individual stand geometry can be stored per stand. Public maps color stands by inventory status and never expose client names. Internal users can inspect status, price, allocation, reservation reference, and sale state.

## Risks And Improvements

- Shape file and KML import should run through a background worker because large GIS uploads can be slow.
- Velocity reconciliation needs idempotent trace handling to prevent duplicate payments.
- PDF generation should be queued for high volume months.
- Custom auth policies should be extended into route middleware once real organization membership is added.
- Audit logs should be streamed to external retention storage for regulated deployments.
