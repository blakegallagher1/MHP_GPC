-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE "Owner" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "mailingStreet" TEXT,
    "mailingCity" TEXT,
    "mailingState" TEXT,
    "mailingZip" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "Park" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "ownerId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL UNIQUE,
    "addressStreet" TEXT,
    "addressCity" TEXT,
    "addressState" TEXT,
    "addressZip" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "location" GEOMETRY(Point, 4326),
    "padCount" INTEGER,
    "occupancyRate" NUMERIC(5,2),
    "avgRent" NUMERIC(10,2),
    "utilitiesSetup" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "Park_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE CASCADE
);

CREATE INDEX "Park_ownerId_idx" ON "Park"("ownerId");

CREATE TABLE "Lead" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "parkId" UUID NOT NULL,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "stage" TEXT NOT NULL DEFAULT 'INTAKE',
    "assignedTo" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "Lead_parkId_fkey" FOREIGN KEY ("parkId") REFERENCES "Park"("id") ON DELETE CASCADE
);

CREATE TABLE "Deal" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "leadId" UUID NOT NULL,
    "stage" TEXT NOT NULL DEFAULT 'INTAKE',
    "offerPrice" NUMERIC(14,2),
    "targetCapRate" NUMERIC(6,3),
    "noi" NUMERIC(14,2),
    "dscr" NUMERIC(6,3),
    "targetCloseDate" TIMESTAMPTZ,
    "buyBoxStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "dealScore" INTEGER DEFAULT 0,
    "underwritingNotes" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "Deal_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE
);

CREATE TABLE "Touchpoint" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "leadId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "notes" TEXT,
    "performedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "author" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "Touchpoint_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE
);

CREATE INDEX "Touchpoint_leadId_performedAt_idx" ON "Touchpoint"("leadId", "performedAt");

CREATE TABLE "Document" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "dealId" UUID,
    "parkId" UUID,
    "category" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "checksum" TEXT,
    "isSensitive" BOOLEAN NOT NULL DEFAULT FALSE,
    "uploadedBy" TEXT,
    "uploadedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "metadata" JSONB,
    CONSTRAINT "Document_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE SET NULL,
    CONSTRAINT "Document_parkId_fkey" FOREIGN KEY ("parkId") REFERENCES "Park"("id") ON DELETE SET NULL
);

CREATE TABLE "Task" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "dealId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "dueDate" TIMESTAMPTZ,
    "assignedTo" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "checklist" TEXT,
    CONSTRAINT "Task_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "Task_dealId_title_key" ON "Task"("dealId", "title");

CREATE TABLE "RiskAssessment" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "dealId" UUID NOT NULL,
    "score" INTEGER NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "notes" TEXT,
    "assessedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "assessedBy" TEXT,
    CONSTRAINT "RiskAssessment_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE
);

CREATE TABLE "DecisionLog" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "dealId" UUID NOT NULL,
    "decision" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "recordedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "DecisionLog_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE
);

CREATE TABLE "ConsentLog" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "ownerId" UUID NOT NULL,
    "channel" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL DEFAULT FALSE,
    "metadata" JSONB,
    "recordedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "ConsentLog_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE CASCADE
);

CREATE INDEX "ConsentLog_owner_channel_idx" ON "ConsentLog"("ownerId", "channel");

CREATE TABLE "ScenarioEvaluation" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "dealId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "inputs" JSONB NOT NULL,
    "results" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "ScenarioEvaluation_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE
);
