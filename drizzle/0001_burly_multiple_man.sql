CREATE TABLE `settings` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`github_pat` text,
	`github_username` text,
	`cloudflare_account_id` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `projects` ADD `github_repo_id` integer;--> statement-breakpoint
ALTER TABLE `projects` ADD `github_repo_full_name` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `is_cloudflare_project` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `projects` ADD `cloudflare_project_name` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `prod_url` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `staging_url` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `coding_agents` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `primary_model` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `agent_instructions_url` text;