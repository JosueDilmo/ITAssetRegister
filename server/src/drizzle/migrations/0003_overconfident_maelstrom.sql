CREATE TABLE "licence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"vendor" text NOT NULL,
	"licenceType" text NOT NULL,
	"licenceKey" text,
	"licenceNumber" text NOT NULL,
	"datePurchased" date NOT NULL,
	"expiryDate" date,
	"seatsTotal" integer DEFAULT 1 NOT NULL,
	"cost" numeric(10, 2),
	"assignedTo" text,
	"dateAssigned" date,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"note" text DEFAULT '',
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"createdBy" text NOT NULL,
	"changeLog" jsonb DEFAULT '[]'::jsonb,
	CONSTRAINT "licence_licenceNumber_unique" UNIQUE("licenceNumber")
);
--> statement-breakpoint
ALTER TABLE "staff" ADD COLUMN "licenceHistoryList" jsonb DEFAULT '[]'::jsonb;