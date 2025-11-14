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
    event_id: integer("event_id").references(() => events.id), // Allow null for backward compatibility
    created_at: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    nameIndex: index("name_idx").on(table.name),
    eventIndex: index("attendee_event_idx").on(table.event_id),
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

export const events = createTable(
  "event",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    name: varchar("name", { length: 256 }).notNull(),
    description: varchar("description", { length: 2048 }),
    address: varchar("address", { length: 512 }),
    start_date: timestamp("start_date", { withTimezone: true }),
    end_date: timestamp("end_date", { withTimezone: true }),
    max_capacity: integer("max_capacity"),
    is_active: boolean("is_active").default(true),
    created_by: varchar("created_by", { length: 255 })
      .notNull()
      .references(() => users.id),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    nameIndex: index("event_name_idx").on(table.name),
    createdByIndex: index("event_created_by_idx").on(table.created_by),
  })
);

export const teams = createTable(
  "team",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    name: varchar("name", { length: 256 }).notNull(),
    description: varchar("description", { length: 1024 }),
    event_id: integer("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    created_by: varchar("created_by", { length: 255 })
      .notNull()
      .references(() => users.id),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    eventIndex: index("team_event_idx").on(table.event_id),
    nameIndex: index("team_name_idx").on(table.name),
  })
);

export const teamMembers = createTable(
  "team_member",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    team_id: integer("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    user_id: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 50 }).notNull().default("moderator"), // admin, moderator
    permissions: varchar("permissions", { length: 1024 }).default("{}"), // JSON string for permissions
    invited_by: varchar("invited_by", { length: 255 }).references(
      () => users.id
    ),
    status: varchar("status", { length: 50 }).default("active"), // active, inactive, pending
    joined_at: timestamp("joined_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    teamUserIndex: index("team_member_team_user_idx").on(
      table.team_id,
      table.user_id
    ),
    userIndex: index("team_member_user_idx").on(table.user_id),
  })
);

export const teamInvites = createTable(
  "team_invite",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    invite_code: varchar("invite_code", { length: 100 }).notNull().unique(),
    team_id: integer("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    event_id: integer("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 50 }).notNull().default("moderator"), // admin, moderator
    permissions: varchar("permissions", { length: 1024 }).default("{}"), // JSON string for permissions
    created_by: varchar("created_by", { length: 255 })
      .notNull()
      .references(() => users.id),
    uses_limit: integer("uses_limit"), // null = unlimited
    used_count: integer("used_count").default(0),
    expires_at: timestamp("expires_at", { withTimezone: true }),
    is_active: boolean("is_active").default(true),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    codeIndex: index("team_invite_code_idx").on(table.invite_code),
    teamIndex: index("team_invite_team_idx").on(table.team_id),
    eventIndex: index("team_invite_event_idx").on(table.event_id),
  })
);

export const tasks = createTable(
  "task",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    title: varchar("title", { length: 256 }).notNull(),
    description: varchar("description", { length: 2048 }),
    status: varchar("status", { length: 50 }).notNull().default("backlog"), // done, in-progress, backlog, in-review, cancelled
    priority: varchar("priority", { length: 20 }).default("medium"), // low, medium, high, urgent
    event_id: integer("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    assigned_to: varchar("assigned_to", { length: 255 }).references(
      () => users.id
    ),
    created_by: varchar("created_by", { length: 255 })
      .notNull()
      .references(() => users.id),
    due_date: timestamp("due_date", { withTimezone: true }),
    completed_at: timestamp("completed_at", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    statusIndex: index("task_status_idx").on(table.status),
    eventIndex: index("task_event_idx").on(table.event_id),
    assignedIndex: index("task_assigned_idx").on(table.assigned_to),
  })
);

// Add relations for the new tables
export const eventsRelations = relations(events, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [events.created_by],
    references: [users.id],
  }),
  teams: many(teams),
  tasks: many(tasks),
  attendees: many(attendees),
}));

export const teamsRelations = relations(teams, ({ one, many }) => ({
  event: one(events, { fields: [teams.event_id], references: [events.id] }),
  createdBy: one(users, { fields: [teams.created_by], references: [users.id] }),
  members: many(teamMembers),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, { fields: [teamMembers.team_id], references: [teams.id] }),
  user: one(users, { fields: [teamMembers.user_id], references: [users.id] }),
  invitedBy: one(users, {
    fields: [teamMembers.invited_by],
    references: [users.id],
  }),
}));

export const teamInvitesRelations = relations(teamInvites, ({ one }) => ({
  team: one(teams, { fields: [teamInvites.team_id], references: [teams.id] }),
  event: one(events, {
    fields: [teamInvites.event_id],
    references: [events.id],
  }),
  createdBy: one(users, {
    fields: [teamInvites.created_by],
    references: [users.id],
  }),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  event: one(events, { fields: [tasks.event_id], references: [events.id] }),
  assignedTo: one(users, {
    fields: [tasks.assigned_to],
    references: [users.id],
  }),
  createdBy: one(users, { fields: [tasks.created_by], references: [users.id] }),
}));

// Update attendees to link to events
export const attendeesRelations = relations(attendees, ({ one }) => ({
  event: one(events, { fields: [attendees.event_id], references: [events.id] }),
}));

// Export schema object for better-auth integration
export const schema = {
  users,
  accounts,
  sessions,
  verifications,
  attendees,
  failedWebhooks,
  events,
  teams,
  teamMembers,
  teamInvites,
  tasks,
};
