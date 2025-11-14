// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import {
  index,
  integer,
  pgTableCreator,
  timestamp,
  varchar,
  boolean,
} from "drizzle-orm/pg-core";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `stampede_${name}`);

export const users = createTable(
  "user",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    name: varchar("name", { length: 256 }).notNull(),
    attended: boolean("attended").default(false),
    email: varchar("email", { length: 256 }).notNull(),
    phone: varchar("phone", { length: 256 }).notNull(),
    transaction_id: varchar("transaction_id", { length: 256 }).notNull(),
    status: varchar("status", { length: 256 }).notNull(),
    screenshot: varchar("screenshot", { length: 256 }).notNull(),
    ticket_sent: boolean("ticket_sent").default(false),
    ticket_sent_at: timestamp("ticket_sent_at"),
    created_at: timestamp("created_at").defaultNow(),
  },
  (example) => ({
    nameIndex: index("name_idx").on(example.name),
  }),
);

export const failedWebhooks = createTable(
  "failed_webhook",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    raw_data: varchar("raw_data", { length: 2048 }).notNull(), // Store original webhook data
    error_message: varchar("error_message", { length: 1024 }).notNull(),
    error_details: varchar("error_details", { length: 2048 }), // Store Zod error details
    status: varchar("status", { length: 50 }).default("pending").notNull(), // pending, resolved, ignored
    extracted_name: varchar("extracted_name", { length: 256 }),
    extracted_email: varchar("extracted_email", { length: 256 }),
    extracted_phone: varchar("extracted_phone", { length: 256 }),
    extracted_transaction_id: varchar("extracted_transaction_id", {
      length: 256,
    }),
    extracted_screenshot: varchar("extracted_screenshot", { length: 256 }),
    notes: varchar("notes", { length: 1024 }), // Admin notes
    created_at: timestamp("created_at").defaultNow(),
    resolved_at: timestamp("resolved_at"),
  },
  (table) => ({
    statusIndex: index("status_idx").on(table.status),
    createdAtIndex: index("created_at_idx").on(table.created_at),
  }),
);
