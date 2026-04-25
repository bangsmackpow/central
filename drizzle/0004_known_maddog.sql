CREATE TABLE `servers` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`api_key` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `projects` ADD `is_docker_project` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `projects` ADD `server_id` text REFERENCES servers(id);--> statement-breakpoint
ALTER TABLE `projects` ADD `portainer_endpoint_id` integer;--> statement-breakpoint
ALTER TABLE `projects` ADD `portainer_stack_name` text;