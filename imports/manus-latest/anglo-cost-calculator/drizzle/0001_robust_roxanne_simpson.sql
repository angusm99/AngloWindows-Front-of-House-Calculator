CREATE TABLE `extraPricingRules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`extraKey` enum('WRAP','DRAINAGE','VIDEO','ROUND_TUBE','BOX_WOOD') NOT NULL,
	`amountCents` int NOT NULL DEFAULT 0,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `extraPricingRules_id` PRIMARY KEY(`id`),
	CONSTRAINT `extraPricingRules_extraKey_unique` UNIQUE(`extraKey`)
);
--> statement-breakpoint
CREATE TABLE `glassPricingRules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`glassType` enum('STANDARD','SPECIAL','SAFETY','FROSTED') NOT NULL,
	`surchargeCents` int NOT NULL DEFAULT 0,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `glassPricingRules_id` PRIMARY KEY(`id`),
	CONSTRAINT `glassPricingRules_glassType_unique` UNIQUE(`glassType`)
);
--> statement-breakpoint
CREATE TABLE `productPricingRules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productType` enum('FIXED_WINDOW','TOP_HUNG_WINDOW','SIDE_HUNG_WINDOW','SLIDING_WINDOW_2_PANEL','SLIDING_WINDOW_3_PANEL','HINGED_DOOR_SINGLE','HINGED_DOOR_DOUBLE','SLIDING_DOOR_2_PANEL','SLIDING_DOOR_3_PANEL') NOT NULL,
	`productCategory` enum('WINDOW','DOOR','SLIDING_DOOR') NOT NULL,
	`baseAmountCents` int NOT NULL DEFAULT 0,
	`areaRatePerSqmCents` int NOT NULL DEFAULT 0,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `productPricingRules_id` PRIMARY KEY(`id`),
	CONSTRAINT `productPricingRules_productType_unique` UNIQUE(`productType`)
);
--> statement-breakpoint
CREATE TABLE `quoteUnits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`quoteId` int NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`roomName` varchar(120) NOT NULL,
	`productCategory` enum('WINDOW','DOOR','SLIDING_DOOR') NOT NULL,
	`productType` enum('FIXED_WINDOW','TOP_HUNG_WINDOW','SIDE_HUNG_WINDOW','SLIDING_WINDOW_2_PANEL','SLIDING_WINDOW_3_PANEL','HINGED_DOOR_SINGLE','HINGED_DOOR_DOUBLE','SLIDING_DOOR_2_PANEL','SLIDING_DOOR_3_PANEL') NOT NULL,
	`configuration` varchar(120),
	`widthMm` int NOT NULL,
	`heightMm` int NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`glassType` enum('STANDARD','SPECIAL','SAFETY','FROSTED') NOT NULL,
	`burglarBarType` enum('NONE','CLEAR','ALUM') NOT NULL DEFAULT 'NONE',
	`frameColour` enum('WHITE','BRONZE','CHARCOAL','BLACK','SILVER','SPECIAL') NOT NULL DEFAULT 'WHITE',
	`hardwareColour` enum('WHITE','BRONZE','CHARCOAL','BLACK','SILVER','SPECIAL') NOT NULL DEFAULT 'WHITE',
	`extrasJson` json,
	`notes` text,
	`unitCostCents` int NOT NULL DEFAULT 0,
	`lineTotalCents` int NOT NULL DEFAULT 0,
	`pricingBreakdownJson` json,
	`validationIssuesJson` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `quoteUnits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobRef` varchar(80) NOT NULL,
	`clientName` varchar(160) NOT NULL,
	`quoteDate` varchar(20) NOT NULL,
	`phone` varchar(40),
	`address` text,
	`salesperson` varchar(120),
	`installer` varchar(120),
	`estimatedHours` int,
	`notes` text,
	`adjustmentKind` enum('NONE','MARKUP_PERCENT','MARKUP_FIXED','DISCOUNT_PERCENT','DISCOUNT_FIXED') NOT NULL DEFAULT 'NONE',
	`adjustmentValue` int NOT NULL DEFAULT 0,
	`subtotalCents` int NOT NULL DEFAULT 0,
	`adjustmentCents` int NOT NULL DEFAULT 0,
	`totalCents` int NOT NULL DEFAULT 0,
	`validationIssuesJson` json,
	`missingPricingJson` json,
	`createdByUserId` int NOT NULL,
	`updatedByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `quotes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `quoteUnits` ADD CONSTRAINT `quoteUnits_quoteId_quotes_id_fk` FOREIGN KEY (`quoteId`) REFERENCES `quotes`(`id`) ON DELETE cascade ON UPDATE no action;