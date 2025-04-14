import { pgTable, text, serial, integer, boolean, date, time, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Define enums for the schema
export const privacyEnum = pgEnum('privacy_level', ['private', 'partner', 'public']);
export const periodEnum = pgEnum('time_period', ['morning', 'afternoon', 'night']);
export const permissionEnum = pgEnum('permission_level', ['view', 'edit']);
export const recurrenceEnum = pgEnum('recurrence_type', ['none', 'daily', 'weekly', 'monthly', 'custom']);
export const partnerStatusEnum = pgEnum('partner_status', ['pending', 'accepted', 'rejected']);

// User table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  avatar: text("avatar"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User schema and types
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

// Events table
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  date: date("date").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time"),
  period: periodEnum("period").notNull(),
  location: text("location"),
  emoji: text("emoji"),
  privacy: privacyEnum("privacy").notNull().default("private"),
  ownerId: integer("owner_id").notNull().references(() => users.id),
  recurrence: recurrenceEnum("recurrence").notNull().default("none"),
  recurrenceEndDate: date("recurrence_end_date"),
  isSpecial: boolean("is_special").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Event relations
export const eventsRelations = relations(events, ({ one, many }) => ({
  owner: one(users, {
    fields: [events.ownerId],
    references: [users.id],
  }),
  participants: many(eventParticipants),
  comments: many(comments),
}));

// Event participants table
export const eventParticipants = pgTable("event_participants", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => events.id),
  userId: integer("user_id").notNull().references(() => users.id),
  permission: permissionEnum("permission").notNull().default("view"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Event participants relations
export const eventParticipantsRelations = relations(eventParticipants, ({ one }) => ({
  event: one(events, {
    fields: [eventParticipants.eventId],
    references: [events.id],
  }),
  user: one(users, {
    fields: [eventParticipants.userId],
    references: [users.id],
  }),
}));

// Comments table
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => events.id),
  userId: integer("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  parentId: integer("parent_id").references(() => comments.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Comments relations
export const commentsRelations = relations(comments, ({ one, many }) => ({
  event: one(events, {
    fields: [comments.eventId],
    references: [events.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id],
  }),
  replies: many(comments, { relationName: "replies" }),
}));

// Reactions table
export const reactions = pgTable("reactions", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => events.id),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Reactions relations
export const reactionsRelations = relations(reactions, ({ one }) => ({
  event: one(events, {
    fields: [reactions.eventId],
    references: [events.id],
  }),
  user: one(users, {
    fields: [reactions.userId],
    references: [users.id],
  }),
}));

// Partners table
export const partners = pgTable("partners", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  partnerId: integer("partner_id").notNull().references(() => users.id),
  status: partnerStatusEnum("status").notNull().default("pending"),
  shareAll: boolean("share_all").default(true),
  shareRaftOnly: boolean("share_raft_only").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Partners relations
export const partnersRelations = relations(partners, ({ one }) => ({
  user: one(users, {
    fields: [partners.userId],
    references: [users.id],
  }),
  partner: one(users, {
    fields: [partners.partnerId],
    references: [users.id],
  }),
}));

// External calendars table
export const externalCalendars = pgTable("external_calendars", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  provider: text("provider").notNull(), // google, apple, outlook
  externalId: text("external_id").notNull(),
  name: text("name").notNull(),
  color: text("color"),
  syncEnabled: boolean("sync_enabled").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// External calendars relations
export const externalCalendarsRelations = relations(externalCalendars, ({ one }) => ({
  user: one(users, {
    fields: [externalCalendars.userId],
    references: [users.id],
  }),
}));

// Schemas for insertion
export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
});

export const insertEventParticipantSchema = createInsertSchema(eventParticipants).omit({
  id: true,
  createdAt: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
});

export const insertReactionSchema = createInsertSchema(reactions).omit({
  id: true,
  createdAt: true,
});

export const insertPartnerSchema = createInsertSchema(partners).omit({
  id: true,
  createdAt: true,
});

export const insertExternalCalendarSchema = createInsertSchema(externalCalendars).omit({
  id: true,
  createdAt: true,
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

export type EventParticipant = typeof eventParticipants.$inferSelect;
export type InsertEventParticipant = z.infer<typeof insertEventParticipantSchema>;

export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;

export type Reaction = typeof reactions.$inferSelect;
export type InsertReaction = z.infer<typeof insertReactionSchema>;

export type Partner = typeof partners.$inferSelect;
export type InsertPartner = z.infer<typeof insertPartnerSchema>;

export type ExternalCalendar = typeof externalCalendars.$inferSelect;
export type InsertExternalCalendar = z.infer<typeof insertExternalCalendarSchema>;
