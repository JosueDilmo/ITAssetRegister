CREATE TABLE "asset" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"serialNumber" text NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"maker" text NOT NULL,
	"assignedTo" text,
	"dateAssigned" date,
	"datePurchased" date NOT NULL,
	"assetNumber" text NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"note" text DEFAULT '',
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"createdBy" text NOT NULL,
	"changeLog" jsonb DEFAULT '[]'::jsonb,
	CONSTRAINT "asset_serialNumber_unique" UNIQUE("serialNumber"),
	CONSTRAINT "asset_assetNumber_unique" UNIQUE("assetNumber")
);
--> statement-breakpoint
CREATE TABLE "staff" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"department" text NOT NULL,
	"jobTitle" text NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"note" text DEFAULT '',
	"assetHistoryList" jsonb DEFAULT '[]'::jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"createdBy" text NOT NULL,
	"changeLog" jsonb DEFAULT '[]'::jsonb,
	CONSTRAINT "staff_email_unique" UNIQUE("email")
);
