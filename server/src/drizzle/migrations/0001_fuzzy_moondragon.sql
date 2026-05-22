CREATE TABLE "ticketComments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticketId" uuid NOT NULL,
	"authorEmail" text NOT NULL,
	"body" text NOT NULL,
	"source" text DEFAULT 'agent' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticketNumber" integer GENERATED ALWAYS AS IDENTITY (sequence name "tickets_ticketNumber_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"subject" text NOT NULL,
	"description" text NOT NULL,
	"priority" text DEFAULT 'HIGH' NOT NULL,
	"status" text DEFAULT 'NEW' NOT NULL,
	"requesterEmail" text NOT NULL,
	"requesterStaffId" uuid,
	"assignedAgentEmail" text,
	"completionNote" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tickets_ticketNumber_unique" UNIQUE("ticketNumber")
);
--> statement-breakpoint
ALTER TABLE "ticketComments" ADD CONSTRAINT "ticketComments_ticketId_tickets_id_fk" FOREIGN KEY ("ticketId") REFERENCES "public"."tickets"("id") ON DELETE cascade ON UPDATE no action;