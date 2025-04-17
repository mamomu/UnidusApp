import {
  users,
  events,
  eventParticipants,
  comments,
  reactions,
  partners,
  externalCalendars,
  type User,
  type InsertUser,
  type Event,
  type InsertEvent,
  type EventParticipant,
  type InsertEventParticipant,
  type Comment,
  type InsertComment,
  type Reaction,
  type InsertReaction,
  type Partner,
  type InsertPartner,
  type ExternalCalendar,
  type InsertExternalCalendar,
} from "@shared/schema";
import { db } from "./db";
import {
  eq,
  and,
  or,
  inArray,
  between,
  gte,
  lte,
  desc,
  isNull,
} from "drizzle-orm";
import session, { Store } from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import { notEqual } from "assert";

const PostgresSessionStore = connectPg(session);

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Event operations
  getEvent(id: number): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(
    id: number,
    data: Partial<InsertEvent>
  ): Promise<Event | undefined>;
  deleteEvent(id: number): Promise<boolean>;
  getUserEvents(
    userId: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<Event[]>;
  getSharedEvents(
    userId: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<Event[]>;

  // Event participants
  addEventParticipant(data: InsertEventParticipant): Promise<EventParticipant>;
  removeEventParticipant(eventId: number, userId: number): Promise<boolean>;
  getEventParticipants(
    eventId: number
  ): Promise<(EventParticipant & { user: User })[]>;

  // Comments
  addComment(comment: InsertComment): Promise<Comment>;
  getEventComments(eventId: number): Promise<(Comment & { user: User })[]>;

  // Reactions
  addReaction(reaction: InsertReaction): Promise<Reaction>;
  removeReaction(eventId: number, userId: number): Promise<boolean>;
  getEventReactions(eventId: number): Promise<Reaction[]>;

  // Partners
  getPartnerRequests(userId: number): Promise<(Partner & { partner: User })[]>;
  createPartnerRequest(data: InsertPartner): Promise<Partner>;
  updatePartnerStatus(id: number, status: string): Promise<Partner | undefined>;
  getPartners(userId: number): Promise<(Partner & { partner: User })[]>;

  // External calendars
  addExternalCalendar(data: InsertExternalCalendar): Promise<ExternalCalendar>;
  getUserExternalCalendars(userId: number): Promise<ExternalCalendar[]>;

  // Session store
  sessionStore: Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Event operations
  async getEvent(id: number): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const [newEvent] = await db.insert(events).values(event).returning();
    return newEvent;
  }

  async updateEvent(
    id: number,
    data: Partial<InsertEvent>
  ): Promise<Event | undefined> {
    const [updatedEvent] = await db
      .update(events)
      .set(data)
      .where(eq(events.id, id))
      .returning();
    return updatedEvent;
  }

  async deleteEvent(id: number): Promise<boolean> {
    await db.delete(events).where(eq(events.id, id));
    return true;
  }

  async getUserEvents(
    userId: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<Event[]> {
    console.log("Fetching events for user:", userId);
    console.log("Query conditions:", {
      ownerCondition: eq(events.ownerId, userId),
      partnerCondition: and(
        eq(events.privacy, "partner"),
        inArray(events.ownerId, await this.getPartnerIds(userId))
      ),
    });

    const partnerIds = await this.getPartnerIds(userId);

    const query = db
      .select()
      .from(events)
      .where(
        and(
          or(
            and(eq(events.ownerId, userId), eq(events.privacy, "private")), // Private events owned by the user
            and(
              eq(events.privacy, "partner"),
              inArray(events.ownerId, partnerIds)
            ), // Partner events visible to partners
            eq(events.privacy, "public") // Public events visible to everyone
          ),
          startDate && endDate
            ? between(
                events.date,
                startDate.toISOString(),
                endDate.toISOString()
              )
            : undefined
        )
      );

    return await query.orderBy(events.date, events.startTime);
  }

  async getSharedEvents(
    userId: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<Event[]> {
    const partnerIds = await this.getPartnerIds(userId);

    if (partnerIds.length === 0) {
      return [];
    }

    let query = db
      .select()
      .from(events)
      .where(
        and(
          inArray(events.ownerId, partnerIds),
          and(eq(events.privacy, "partner"), eq(events.privacy, "public"))
        )
      );

    if (startDate && endDate) {
      query = db
        .select()
        .from(events)
        .where(
          and(
            inArray(events.ownerId, partnerIds),
            or(eq(events.privacy, "partner"), eq(events.privacy, "public")),
            between(events.date, startDate.toISOString(), endDate.toISOString())
          )
        );
    } else if (startDate) {
      query = db
        .select()
        .from(events)
        .where(gte(events.date, startDate.toISOString()));
    } else if (endDate) {
      query = db
        .select()
        .from(events)
        .where(lte(events.date, endDate.toISOString()));
    }

    return await query.orderBy(events.date, events.startTime);
  }

  // Helper to get partner IDs for a user
  private async getPartnerIds(userId: number): Promise<number[]> {
    const partnerRelations = await db
      .select({ partnerId: partners.partnerId })
      .from(partners)
      .where(and(eq(partners.userId, userId), eq(partners.status, "accepted")));

    return partnerRelations.map((p) => p.partnerId);
  }

  // Event participants
  async addEventParticipant(
    data: InsertEventParticipant
  ): Promise<EventParticipant> {
    const [participant] = await db
      .insert(eventParticipants)
      .values(data)
      .returning();
    return participant;
  }

  async removeEventParticipant(
    eventId: number,
    userId: number
  ): Promise<boolean> {
    await db
      .delete(eventParticipants)
      .where(
        and(
          eq(eventParticipants.eventId, eventId),
          eq(eventParticipants.userId, userId)
        )
      );
    return true;
  }

  async getEventParticipants(
    eventId: number
  ): Promise<(EventParticipant & { user: User })[]> {
    return db
      .select({
        id: eventParticipants.id,
        eventId: eventParticipants.eventId,
        userId: eventParticipants.userId,
        permission: eventParticipants.permission,
        createdAt: eventParticipants.createdAt,
        user: {
          id: users.id,
          username: users.username,
          password: users.password,
          email: users.email,
          fullName: users.fullName,
          avatar: users.avatar,
          createdAt: users.createdAt,
        },
      })
      .from(eventParticipants)
      .innerJoin(users, eq(eventParticipants.userId, users.id))
      .where(eq(eventParticipants.eventId, eventId));
  }

  // Comments
  async addComment(comment: InsertComment): Promise<Comment> {
    const result = await db.insert(comments).values(comment).returning();
    const [newComment] = Array.isArray(result) ? result : result.rows;
    return newComment;
  }

  async getEventComments(
    eventId: number
  ): Promise<(Comment & { user: User })[]> {
    return db
      .select({
        id: comments.id,
        eventId: comments.eventId,
        userId: comments.userId,
        content: comments.content,
        parentId: comments.parentId,
        createdAt: comments.createdAt,
        user: {
          id: users.id,
          username: users.username,
          email: users.email,
          fullName: users.fullName,
          avatar: users.avatar,
        },
      })
      .from(comments)
      .innerJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.eventId, eventId))
      .orderBy(comments.createdAt);
  }

  // Reactions
  async addReaction(reaction: InsertReaction): Promise<Reaction> {
    // First check if this user has already reacted to this event
    await this.removeReaction(reaction.eventId, reaction.userId);

    // Then add the new reaction
    const [newReaction] = await db
      .insert(reactions)
      .values(reaction)
      .returning();
    return newReaction;
  }

  async removeReaction(eventId: number, userId: number): Promise<boolean> {
    await db
      .delete(reactions)
      .where(and(eq(reactions.eventId, eventId), eq(reactions.userId, userId)));
    return true;
  }

  async getEventReactions(eventId: number): Promise<Reaction[]> {
    return db.select().from(reactions).where(eq(reactions.eventId, eventId));
  }

  // Partners
  async getPartnerRequests(
    userId: number
  ): Promise<(Partner & { partner: User })[]> {
    return db
      .select({
        id: partners.id,
        userId: partners.userId,
        partnerId: partners.partnerId,
        status: partners.status,
        shareAll: partners.shareAll,
        shareRaftOnly: partners.shareRaftOnly,
        createdAt: partners.createdAt,
        partner: {
          id: users.id,
          username: users.username,
          password: users.password,
          email: users.email,
          fullName: users.fullName,
          avatar: users.avatar,
          createdAt: users.createdAt,
        },
      })
      .from(partners)
      .innerJoin(users, eq(partners.partnerId, users.id))
      .where(and(eq(partners.userId, userId), eq(partners.status, "pending")));
  }

  async createPartnerRequest(data: InsertPartner): Promise<Partner> {
    const [request] = await db.insert(partners).values(data).returning();
    return request;
  }

  async updatePartnerStatus(
    id: number,
    status: string
  ): Promise<Partner | undefined> {
    const [updatedPartner] = await db
      .update(partners)
      .set({ status: status as any })
      .where(eq(partners.id, id))
      .returning();
    return updatedPartner;
  }

  async getPartners(userId: number): Promise<(Partner & { partner: User })[]> {
    return db
      .select({
        id: partners.id,
        userId: partners.userId,
        partnerId: partners.partnerId,
        status: partners.status,
        shareAll: partners.shareAll,
        shareRaftOnly: partners.shareRaftOnly,
        createdAt: partners.createdAt,
        partner: {
          id: users.id,
          username: users.username,
          password: users.password,
          email: users.email,
          fullName: users.fullName,
          avatar: users.avatar,
          createdAt: users.createdAt,
        },
      })
      .from(partners)
      .innerJoin(users, eq(partners.partnerId, users.id))
      .where(and(eq(partners.userId, userId), eq(partners.status, "accepted")));
  }

  // External calendars
  async addExternalCalendar(
    data: InsertExternalCalendar
  ): Promise<ExternalCalendar> {
    const [calendar] = await db
      .insert(externalCalendars)
      .values(data)
      .returning();
    return calendar;
  }

  async getUserExternalCalendars(userId: number): Promise<ExternalCalendar[]> {
    return db
      .select()
      .from(externalCalendars)
      .where(eq(externalCalendars.userId, userId));
  }

  async isPartnerWithAccess(userId: number, eventId: number): Promise<boolean> {
    const partnerIds = await this.getPartnerIds(userId);
    const [event] = await db
      .select()
      .from(events)
      .where(
        and(
          eq(events.id, eventId),
          inArray(events.ownerId, partnerIds),
          eq(events.privacy, "partner")
        )
      );

    return !!event;
  }

  async getEventWithParticipants(eventId: number): Promise<
    | {
        event: Event;
        owner: User;
        participants: (EventParticipant & { user: User })[];
      }
    | undefined
  > {
    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId));

    if (!event) return undefined;

    const [owner] = await db
      .select()
      .from(users)
      .where(eq(users.id, event.ownerId));

    const participants = await this.getEventParticipants(eventId);

    return { event, owner, participants };
  }

  async addPartnerToSharedEvents(
    userId: number,
    partnerId: number
  ): Promise<void> {
    const sharedEvents = await db
      .select()
      .from(events)
      .where(and(eq(events.ownerId, userId), eq(events.privacy, "partner")));

    await Promise.all(
      sharedEvents.map((event) =>
        db.insert(eventParticipants).values({
          eventId: event.id,
          userId: partnerId,
          permission: "view",
        })
      )
    );
  }
}

export const storage = new DatabaseStorage();
