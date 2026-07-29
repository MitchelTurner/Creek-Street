-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "ProjectType" AS ENUM ('NEW_CONSTRUCTION', 'EXTERIOR_ALTERATION', 'SIGNAGE', 'AWNING_CANOPY', 'PAINT_MATERIALS', 'DEMOLITION', 'BOARDWALK_STRUCTURE', 'SUBSTRUCTURE_PILING', 'OTHER');
CREATE TYPE "ApplicationStatus" AS ENUM ('DRAFT', 'FILED', 'SCHEDULED', 'BOARD_REVIEWED', 'FORWARDED', 'APPROVED', 'APPROVED_W_CONDITIONS', 'DENIED', 'WITHDRAWN');
CREATE TYPE "DataSource" AS ENUM ('MIRRORED', 'APPLICANT_DRAFT');
CREATE TYPE "CriterionKey" AS ENUM ('UNIFORMITY', 'DISSIMILARITY', 'APPROPRIATENESS', 'DESIGN_QUALITY', 'MATERIAL_HONESTY');
CREATE TYPE "TagWeight" AS ENUM ('DECISIVE', 'SUPPORTING', 'INCIDENTAL');
CREATE TYPE "ExemplarSide" AS ENUM ('BEFORE', 'AFTER', 'AS_PROPOSED', 'AS_BUILT');
CREATE TYPE "SeatType" AS ENUM ('AT_LARGE', 'PROPERTY_OWNER', 'BUSINESS_OWNER', 'DESIGN_PROFESSIONAL', 'OTHER');
CREATE TYPE "MeetingStatus" AS ENUM ('SCHEDULED', 'HELD', 'CANCELLED', 'FAILED_QUORUM');
CREATE TYPE "SubscriptionScope" AS ENUM ('PARCEL', 'RADIUS', 'PROJECT_TYPE', 'DISTRICT_WIDE');
CREATE TYPE "Channel" AS ENUM ('EMAIL', 'RSS');
CREATE TYPE "UserRole" AS ENUM ('APPLICANT', 'BOARD_MEMBER', 'STAFF', 'ADMIN');

-- CreateTable
CREATE TABLE "Parcel" (
    "id" TEXT NOT NULL,
    "parcelNumber" TEXT NOT NULL,
    "address" TEXT,
    "geometry" JSONB,
    "inHdZone" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Parcel_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Structure" (
    "id" TEXT NOT NULL,
    "parcelId" TEXT NOT NULL,
    "commonName" TEXT,
    "addressLabel" TEXT,
    "yearBuilt" INTEGER,
    "nrhpContributing" BOOLEAN,
    "historicNarrative" TEXT,
    "publicSlug" TEXT NOT NULL,
    "notes" TEXT,
    "centroid" JSONB,
    "sourceDocUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Structure_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Photo" (
    "id" TEXT NOT NULL,
    "structureId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "takenAt" TIMESTAMP(3),
    "yearApprox" INTEGER,
    "isHistoric" BOOLEAN NOT NULL DEFAULT false,
    "credit" TEXT,
    "caption" TEXT,
    "submittedByUserId" TEXT,
    "moderationStatus" "ModerationStatus" NOT NULL DEFAULT 'APPROVED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "caseNumber" TEXT,
    "parcelId" TEXT NOT NULL,
    "structureId" TEXT,
    "applicantName" TEXT,
    "projectType" "ProjectType" NOT NULL,
    "description" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL,
    "filedAt" TIMESTAMP(3),
    "source" "DataSource" NOT NULL,
    "sourceDocUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Decision" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "meetingId" TEXT,
    "recommendation" TEXT NOT NULL,
    "conditions" TEXT,
    "voteFor" INTEGER,
    "voteAgainst" INTEGER,
    "finalOutcome" TEXT,
    "sourceDocUrl" TEXT NOT NULL,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Decision_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Criterion" (
    "key" "CriterionKey" NOT NULL,
    "label" TEXT NOT NULL,
    "plainLanguage" TEXT NOT NULL,
    "codeCite" TEXT NOT NULL DEFAULT 'KGBC 18.40.010(13)',
    "codeText" TEXT,
    CONSTRAINT "Criterion_pkey" PRIMARY KEY ("key")
);

CREATE TABLE "DecisionCriterionTag" (
    "id" TEXT NOT NULL,
    "decisionId" TEXT NOT NULL,
    "criterion" "CriterionKey" NOT NULL,
    "weight" "TagWeight" NOT NULL,
    CONSTRAINT "DecisionCriterionTag_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PrecedentExemplar" (
    "id" TEXT NOT NULL,
    "decisionId" TEXT NOT NULL,
    "photoUrl" TEXT NOT NULL,
    "side" "ExemplarSide" NOT NULL,
    "caption" TEXT NOT NULL,
    "sourceDocUrl" TEXT NOT NULL,
    CONSTRAINT "PrecedentExemplar_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TriageFlow" (
    "id" TEXT NOT NULL,
    "projectType" "ProjectType" NOT NULL,
    "version" INTEGER NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "tree" JSONB NOT NULL,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    CONSTRAINT "TriageFlow_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Agency" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "jurisdiction" TEXT NOT NULL,
    "contactUrl" TEXT NOT NULL,
    CONSTRAINT "Agency_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PermitTrigger" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "permitName" TEXT NOT NULL,
    "statutoryCite" TEXT NOT NULL,
    "conditions" JSONB NOT NULL,
    "typicalLeadTimeDays" INTEGER,
    "guidanceUrl" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "verifiedNote" TEXT,
    CONSTRAINT "PermitTrigger_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Seat" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "seatType" "SeatType" NOT NULL,
    CONSTRAINT "Seat_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SeatTerm" (
    "id" TEXT NOT NULL,
    "seatId" TEXT NOT NULL,
    "memberName" TEXT,
    "termStart" TIMESTAMP(3) NOT NULL,
    "termEnd" TIMESTAMP(3) NOT NULL,
    "vacatedAt" TIMESTAMP(3),
    CONSTRAINT "SeatTerm_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Meeting" (
    "id" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL DEFAULT 'Assembly Chambers, White Cliff Building',
    "status" "MeetingStatus" NOT NULL DEFAULT 'SCHEDULED',
    "quorumMet" BOOLEAN,
    "cancelReason" TEXT,
    "noticeUrl" TEXT,
    "agendaUrl" TEXT,
    "minutesUrl" TEXT,
    "videoUrl" TEXT,
    "sourceDocUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "seatTermId" TEXT NOT NULL,
    "present" BOOLEAN NOT NULL,
    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgendaItem" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "applicationId" TEXT,
    "itemNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    CONSTRAINT "AgendaItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MeetingSummary" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "perItem" JSONB NOT NULL,
    "model" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "MeetingSummary_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PrecedentEmbedding" (
    "applicationId" TEXT NOT NULL,
    "sourceText" TEXT NOT NULL,
    "embedding" JSONB,
    "refreshedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PrecedentEmbedding_pkey" PRIMARY KEY ("applicationId")
);

CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "scope" "SubscriptionScope" NOT NULL,
    "parcelId" TEXT,
    "centerPoint" JSONB,
    "radiusMeters" INTEGER,
    "projectTypes" "ProjectType"[],
    "channel" "Channel" NOT NULL DEFAULT 'EMAIL',
    "confirmedAt" TIMESTAMP(3),
    "unsubToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- PRIVATE notes — never expose via public API joins
CREATE TABLE "MemberNote" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MemberNote_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ShipCall" (
    "id" TEXT NOT NULL,
    "callDate" TIMESTAMP(3) NOT NULL,
    "vesselName" TEXT NOT NULL,
    "estimatedPax" INTEGER,
    "source" TEXT NOT NULL DEFAULT 'ktnport',
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ShipCall_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'APPLICANT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DistrictFeature" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "geometry" JSONB NOT NULL,
    "properties" JSONB,
    "sourceDocUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DistrictFeature_pkey" PRIMARY KEY ("id")
);

-- Indexes & uniques
CREATE UNIQUE INDEX "Parcel_parcelNumber_key" ON "Parcel"("parcelNumber");
CREATE UNIQUE INDEX "Structure_publicSlug_key" ON "Structure"("publicSlug");
CREATE INDEX "Structure_nrhpContributing_idx" ON "Structure"("nrhpContributing");
CREATE INDEX "Photo_structureId_takenAt_idx" ON "Photo"("structureId", "takenAt");
CREATE UNIQUE INDEX "Application_caseNumber_key" ON "Application"("caseNumber");
CREATE INDEX "Application_status_filedAt_idx" ON "Application"("status", "filedAt");
CREATE INDEX "Application_projectType_idx" ON "Application"("projectType");
CREATE INDEX "Decision_decidedAt_idx" ON "Decision"("decidedAt");
CREATE UNIQUE INDEX "DecisionCriterionTag_decisionId_criterion_key" ON "DecisionCriterionTag"("decisionId", "criterion");
CREATE UNIQUE INDEX "TriageFlow_projectType_version_key" ON "TriageFlow"("projectType", "version");
CREATE UNIQUE INDEX "Agency_shortName_key" ON "Agency"("shortName");
CREATE UNIQUE INDEX "Seat_label_key" ON "Seat"("label");
CREATE INDEX "SeatTerm_seatId_termStart_idx" ON "SeatTerm"("seatId", "termStart");
CREATE INDEX "Meeting_scheduledAt_idx" ON "Meeting"("scheduledAt");
CREATE UNIQUE INDEX "Attendance_meetingId_seatTermId_key" ON "Attendance"("meetingId", "seatTermId");
CREATE UNIQUE INDEX "MeetingSummary_meetingId_key" ON "MeetingSummary"("meetingId");
CREATE UNIQUE INDEX "Subscription_unsubToken_key" ON "Subscription"("unsubToken");
CREATE INDEX "MemberNote_authorId_applicationId_idx" ON "MemberNote"("authorId", "applicationId");
CREATE INDEX "ShipCall_callDate_idx" ON "ShipCall"("callDate");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- FKs
ALTER TABLE "Structure" ADD CONSTRAINT "Structure_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "Parcel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "Structure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Application" ADD CONSTRAINT "Application_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "Parcel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Application" ADD CONSTRAINT "Application_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "Structure"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Decision" ADD CONSTRAINT "Decision_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Document" ADD CONSTRAINT "Document_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DecisionCriterionTag" ADD CONSTRAINT "DecisionCriterionTag_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "Decision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DecisionCriterionTag" ADD CONSTRAINT "DecisionCriterionTag_criterion_fkey" FOREIGN KEY ("criterion") REFERENCES "Criterion"("key") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PrecedentExemplar" ADD CONSTRAINT "PrecedentExemplar_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "Decision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PermitTrigger" ADD CONSTRAINT "PermitTrigger_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SeatTerm" ADD CONSTRAINT "SeatTerm_seatId_fkey" FOREIGN KEY ("seatId") REFERENCES "Seat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_seatTermId_fkey" FOREIGN KEY ("seatTermId") REFERENCES "SeatTerm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AgendaItem" ADD CONSTRAINT "AgendaItem_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AgendaItem" ADD CONSTRAINT "AgendaItem_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MeetingSummary" ADD CONSTRAINT "MeetingSummary_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PrecedentEmbedding" ADD CONSTRAINT "PrecedentEmbedding_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MemberNote" ADD CONSTRAINT "MemberNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MemberNote" ADD CONSTRAINT "MemberNote_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
