import { users, events, eventParticipants, comments, reactions, partners, externalCalendars, 
  type User, type InsertUser, type Event, type InsertEvent, 
  type EventParticipant, type InsertEventParticipant, 
  type Comment, type InsertComment,
  type Reaction, type InsertReaction,
  type Partner, type InsertPartner,
  type ExternalCalendar, type InsertExternalCalendar
} from "@shared/schema";
import { db } from "./db";
import { eq, and, inArray, between, gte, lte, desc, isNull } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

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
  updateEvent(id: number, data: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: number): Promise<boolean>;
  getUserEvents(userId: number, startDate?: Date, endDate?: Date): Promise<Event[]>;
  getSharedEvents(userId: number, startDate?: Date, endDate?: Date): Promise<Event[]>;
  
  // Event participants
  addEventParticipant(data: InsertEventParticipant): Promise<EventParticipant>;
  removeEventParticipant(eventId: number, userId: number): Promise<boolean>;
  getEventParticipants(eventId: number): Promise<(EventParticipant & { user: User })[]>;
  
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
  sessionStore: session.SessionStore;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Event operations
  async getEvent(id: number): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const [newEvent] = await db
      .insert(events)
      .values(event)
      .returning();
    return newEvent;
  }

  async updateEvent(id: number, data: Partial<InsertEvent>): Promise<Event | undefined> {
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

  async getUserEvents(userId: number, startDate?: Date, endDate?: Date): Promise<Event[]> {
    let query = db.select().from(events).where(eq(events.ownerId, userId));
    
    if (startDate && endDate) {
      query = query.where(between(events.date, startDate, endDate));
    } else if (startDate) {
      query = query.where(gte(events.date, startDate));
    } else if (endDate) {
      query = query.where(lte(events.date, endDate));
    }
    
    return await query.orderBy(events.date, events.startTime);
  }

  async getSharedEvents(userId: number, startDate?: Date, endDate?: Date): Promise<Event[]> {
    const partnerIds = await this.getPartnerIds(userId);
    
    if (partnerIds.length === 0) {
      return [];
    }
    
    let query = db.select().from(events)
      .where(
        and(
          inArray(events.ownerId, partnerIds),
          and(
            eq(events.privacy, 'partner'),
            eq(events.privacy, 'public')
          )
        )
      );
    
    if (startDate && endDate) {
      query = query.where(between(events.date, startDate, endDate));
    } else if (startDate) {
      query = query.where(gte(events.date, startDate));
    } else if (endDate) {
      query = query.where(lte(events.date, endDate));
    }
    
    return await query.orderBy(events.date, events.startTime);
  }

  // Helper to get partner IDs for a user
  private async getPartnerIds(userId: number): Promise<number[]> {
    const partnerRelations = await db
      .select({ partnerId: partners.partnerId })
      .from(partners)
      .where(
        and(
          eq(partners.userId, userId),
          eq(partners.status, 'accepted')
        )
      );
    
    return partnerRelations.map(p => p.partnerId);
  }

  // Event participants
  async addEventParticipant(data: InsertEventParticipant): Promise<EventParticipant> {
    const [participant] = await db
      .insert(eventParticipants)
      .values(data)
      .returning();
    return participant;
  }

  async removeEventParticipant(eventId: number, userId: number): Promise<boolean> {
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

  async getEventParticipants(eventId: number): Promise<(EventParticipant & { user: User })[]> {
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
          email: users.email,
          fullName: users.fullName,
          avatar: users.avatar
        }
      })
      .from(eventParticipants)
      .innerJoin(users, eq(eventParticipants.userId, users.id))
      .where(eq(eventParticipants.eventId, eventId));
  }

  // Comments
  async addComment(comment: InsertComment): Promise<Comment> {
    const [newComment] = await db
      .insert(comments)
      .values(comment)
      .returning();
    return newComment;
  }

  async getEventComments(eventId: number): Promise<(Comment & { user: User })[]> {
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
          avatar: users.avatar
        }
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
      .where(
        and(
          eq(reactions.eventId, eventId),
          eq(reactions.userId, userId)
        )
      );
    return true;
  }

  async getEventReactions(eventId: number): Promise<Reaction[]> {
    return db
      .select()
      .from(reactions)
      .where(eq(reactions.eventId, eventId));
  }

  // Partners
  async getPartnerRequests(userId: number): Promise<(Partner & { partner: User })[]> {
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
          email: users.email,
          fullName: users.fullName,
          avatar: users.avatar
        }
      })
      .from(partners)
      .innerJoin(users, eq(partners.partnerId, users.id))
      .where(
        and(
          eq(partners.userId, userId),
          eq(partners.status, 'pending')
        )
      );
  }

  async createPartnerRequest(data: InsertPartner): Promise<Partner> {
    const [request] = await db
      .insert(partners)
      .values(data)
      .returning();
    return request;
  }

  async updatePartnerStatus(id: number, status: string): Promise<Partner | undefined> {
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
          email: users.email,
          fullName: users.fullName,
          avatar: users.avatar
        }
      })
      .from(partners)
      .innerJoin(users, eq(partners.partnerId, users.id))
      .where(
        and(
          eq(partners.userId, userId),
          eq(partners.status, 'accepted')
        )
      );
  }

  // External calendars
  async addExternalCalendar(data: InsertExternalCalendar): Promise<ExternalCalendar> {
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
}

export const storage = new DatabaseStorage();
