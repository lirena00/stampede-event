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
import { relations } from "drizzle-orm";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `stampede_${name}`);

export const users = createTable("user", (d) => ({
  id: d
    .varchar({ length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: d.varchar({ length: 255 }),
  email: d.varchar({ length: 255 }).notNull(),
  emailVerified: d.boolean(),
  image: d.varchar({ length: 255 }),
  createdAt: d.timestamp({ withTimezone: true }).defaultNow().notNull(),
  updatedAt: d
    .timestamp({ withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
}));

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
}));

export const accounts = createTable(
  "account",
  (d) => ({
    id: d.varchar().notNull().primaryKey(),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    providerId: d.varchar({ length: 255 }).notNull(),
    accountId: d.varchar({ length: 255 }).notNull(),
    refreshToken: d.text(),
    accessToken: d.text(),
    accessTokenExpiresAt: d.timestamp({ withTimezone: true }).notNull(),
    scope: d.varchar({ length: 255 }),
    idToken: d.text(),
    createdAt: d.timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: d
      .timestamp({ withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  }),
  (t) => [index("account_user_id_idx").on(t.userId)]
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessions = createTable(
  "session",
  (d) => ({
    id: d.text().primaryKey(),
    token: d.varchar({ length: 255 }).notNull(),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    ipAddress: d.text(),
    userAgent: d.text(),
    expiresAt: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
    createdAt: d.timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: d
      .timestamp({ withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  }),
  (t) => [index("t_user_id_idx").on(t.userId)]
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const verifications = createTable("verification", (d) => ({
  id: d.text().primaryKey(),
  identifier: d.text().notNull(),
  value: d.text().notNull(),
  expiresAt: d.timestamp({ withTimezone: true }).notNull(),
  createdAt: d.timestamp({ withTimezone: true }).$defaultFn(() => new Date()),
  updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
}));

export const attendees = createTable(
  "attendee",
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
  (table) => ({
    nameIndex: index("name_idx").on(table.name),
  })
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
  })
);

// Export schema object for better-auth integration
export const schema = {
  users,
  accounts,
  sessions,
  verifications,
  attendees,
  failedWebhooks,
};
