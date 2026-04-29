ALTER TABLE `projects` ADD `is_worker` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `projects` ADD `cloudflare_worker_name` text;--> statement-breakpoint
ALTER TABLE `settings` ADD `cloudflare_token` text;