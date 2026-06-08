CREATE TABLE `agent_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`sessionId` int,
	`agentId` varchar(64) NOT NULL,
	`role` enum('user','agent') NOT NULL,
	`content` text NOT NULL,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agent_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `annotations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`sessionId` int,
	`authorType` enum('user','agent') NOT NULL,
	`authorId` varchar(64),
	`x` float NOT NULL,
	`y` float NOT NULL,
	`label` varchar(255),
	`description` text,
	`color` varchar(32) DEFAULT '#6366f1',
	`resolved` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `annotations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audit_results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`pillar` enum('User-Friendly','Zero-Latency','Fool-Proof','Accessibility') NOT NULL,
	`score` float NOT NULL,
	`findings` text,
	`recommendations` text,
	`wcagLevel` enum('AA','AAA'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_results_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `change_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`sessionId` int,
	`location` enum('Header','Footer','Navigation','Hero','Modal','Form','Card','Button','Typography','Layout','Sidebar','Dashboard','Onboarding','Settings','Profile','Other') NOT NULL,
	`changeType` enum('Visual','Functional','UX','Performance','Accessibility','Copy') NOT NULL,
	`priority` enum('critical','high','medium','low') NOT NULL DEFAULT 'medium',
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`agentId` varchar(64),
	`status` enum('pending','in_progress','completed','rejected') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `change_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`status` enum('active','paused','completed','archived') NOT NULL DEFAULT 'active',
	`agentsMd` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `voice_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255),
	`transcript` text,
	`structuredNotes` text,
	`audioUrl` varchar(1024),
	`status` enum('recording','processing','completed') NOT NULL DEFAULT 'recording',
	`durationSeconds` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `voice_sessions_id` PRIMARY KEY(`id`)
);
