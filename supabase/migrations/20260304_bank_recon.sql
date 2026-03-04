-- Bank Statement Reconciliation tables
-- Created: 2026-03-04

-- Statement metadata (one per uploaded PDF)
create table if not exists "bankStatement" (
  "id"              uuid primary key default gen_random_uuid(),
  "bankCode"        text not null default 'KBANK',
  "accountNumber"   text,
  "periodStart"     date,
  "periodEnd"       date,
  "fileName"        text not null,
  "fileUrl"         text not null,
  "openingBalance"  numeric(18,2),
  "closingBalance"  numeric(18,2),
  "entryCount"      int default 0,
  "matchedCount"    int default 0,
  "status"          text not null default 'pending',
  "parseError"      text,
  "createdBy"       uuid,
  "createdByName"   text,
  "createdAt"       timestamptz default now()
);

create index if not exists idx_bankstatement_status on "bankStatement"("status");
create index if not exists idx_bankstatement_created on "bankStatement"("createdAt" desc);

-- Parsed transaction entries
create table if not exists "bankEntry" (
  "id"              uuid primary key default gen_random_uuid(),
  "statementId"     uuid not null references "bankStatement"("id") on delete cascade,
  "lineNumber"      int not null,
  "txDate"          date not null,
  "txTime"          time,
  "channel"         text,
  "description"     text,
  "txType"          text,
  "amount"          numeric(18,2) not null,
  "balance"         numeric(18,2),
  "direction"       text not null,
  "matchStatus"     text not null default 'unmatched',
  "matchConfidence" numeric(5,2),
  "matchMethod"     text,
  "matchNote"       text,
  "matchedBy"       uuid,
  "matchedAt"       timestamptz,
  "createdAt"       timestamptz default now()
);

create index if not exists idx_bankentry_statement on "bankEntry"("statementId");
create index if not exists idx_bankentry_match on "bankEntry"("matchStatus");
create index if not exists idx_bankentry_direction on "bankEntry"("direction");

-- Match junction (entry ↔ invoice, many-to-many)
create table if not exists "bankMatch" (
  "id"              uuid primary key default gen_random_uuid(),
  "entryId"         uuid not null references "bankEntry"("id") on delete cascade,
  "invoiceNumber"   text not null,
  "customerNumber"  text,
  "customerName"    text,
  "invoiceAmount"   numeric(18,2),
  "remainingAmount" numeric(18,2),
  "matchedAmount"   numeric(18,2) not null,
  "createdAt"       timestamptz default now()
);

create index if not exists idx_bankmatch_entry on "bankMatch"("entryId");
create index if not exists idx_bankmatch_invoice on "bankMatch"("invoiceNumber");
