CREATE TYPE "public"."billing_period" AS ENUM('daily', 'weekly', 'monthly', 'yearly');--> statement-breakpoint
CREATE TABLE "plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tier" "plan_tier" NOT NULL,
	"name" varchar(80) NOT NULL,
	"description" text,
	"amount" integer,
	"currency" varchar(8) DEFAULT 'INR' NOT NULL,
	"period" "billing_period" DEFAULT 'monthly' NOT NULL,
	"interval_count" integer DEFAULT 1 NOT NULL,
	"seats" integer NOT NULL,
	"repository_limit" integer NOT NULL,
	"ai_review_credits_total" integer NOT NULL,
	"razorpay_plan_id" varchar(120),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "plans_tier_unique" ON "plans" USING btree ("tier");