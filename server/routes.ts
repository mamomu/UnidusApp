import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import {
  insertEventSchema,
  insertCommentSchema,
  insertReactionSchema,
  insertPartnerSchema,
  insertExternalCalendarSchema,
} from "@shared/schema";

// Authentication middleware
function isAuthenticated(req: Request, res: Response, next: Function) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes (/api/register, /api/login, /api/logout, /api/user)
  setupAuth(app);

  // Event routes
  app.get("/api/events", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const startDate = req.query.startDate
        ? new Date(req.query.startDate as string)
        : undefined;
      const endDate = req.query.endDate
        ? new Date(req.query.endDate as string)
        : undefined;

      // Fetch only events owned by the authenticated user
      const events = await storage.getUserEvents(userId, startDate, endDate);
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.get("/api/events/shared", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const startDate = req.query.startDate
        ? new Date(req.query.startDate as string)
        : undefined;
      const endDate = req.query.endDate
        ? new Date(req.query.endDate as string)
        : undefined;

      const events = await storage.getSharedEvents(userId, startDate, endDate);
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.get("/api/events/:id", isAuthenticated, async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      if (isNaN(eventId)) {
        return res.status(400).json({ message: "Invalid event ID" });
      }

      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      res.json(event);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/events", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { partners, ...eventData } = req.body;

      // Format the date to YYYY-MM-DD
      eventData.date = new Date(eventData.date).toISOString();

      // Validate event data
      const validatedData = insertEventSchema.parse({
        ...eventData,
        ownerId: userId,
      });

      // Create the event
      const newEvent = await storage.createEvent(validatedData);

      // Add partners with permissions if provided
      if (partners && Array.isArray(partners)) {
        await Promise.all(
          partners.map((partner: { userId: number; permission: string }) =>
            storage.addEventParticipant({
              eventId: newEvent.id,
              userId: partner.userId,
              permission: ["view", "edit"].includes(partner.permission)
                ? (partner.permission as "view" | "edit")
                : "view",
            })
          )
        );
      }

      res.status(201).json(newEvent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid event data", errors: error.format() });
      }
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.put("/api/events/:id", isAuthenticated, async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const { partners, ...updateData } = req.body;

      if (isNaN(eventId)) {
        return res.status(400).json({ message: "Invalid event ID" });
      }

      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      if (event.ownerId !== req.user!.id) {
        return res
          .status(403)
          .json({ message: "Not authorized to update this event" });
      }

      // Update the event
      const updatedEvent = await storage.updateEvent(eventId, updateData);

      // Update partners with permissions if provided
      if (partners && Array.isArray(partners)) {
        await Promise.all(
          partners.map((partner: { userId: number; permission: string }) =>
            storage.addEventParticipant({
              eventId,
              userId: partner.userId,
              permission: ["view", "edit"].includes(partner.permission)
                ? (partner.permission as "view" | "edit")
                : "view",
            })
          )
        );
      }

      res.json(updatedEvent);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.delete("/api/events/:id", isAuthenticated, async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      if (isNaN(eventId)) {
        return res.status(400).json({ message: "Invalid event ID" });
      }

      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      if (event.ownerId !== req.user!.id) {
        return res
          .status(403)
          .json({ message: "Not authorized to delete this event" });
      }

      await storage.deleteEvent(eventId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Event participants
  app.get("/api/events/:id/participants", isAuthenticated, async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      if (isNaN(eventId)) {
        return res.status(400).json({ message: "Invalid event ID" });
      }

      const eventData = await storage.getEventWithParticipants(eventId);
      if (!eventData) {
        return res.status(404).json({ message: "Event not found" });
      }

      // Ensure the user is either the owner or a partner with access
      const isOwner = eventData.owner.id === req.user!.id;
      const isPartner = await storage.isPartnerWithAccess(
        req.user!.id,
        eventId
      );

      if (!isOwner && !isPartner) {
        return res
          .status(403)
          .json({ message: "Not authorized to view participants" });
      }

      res.json({
        owner: eventData.owner,
        participants: eventData.participants,
      });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post(
    "/api/events/:id/participants",
    isAuthenticated,
    async (req, res) => {
      try {
        const eventId = parseInt(req.params.id);
        if (isNaN(eventId)) {
          return res.status(400).json({ message: "Invalid event ID" });
        }

        const event = await storage.getEvent(eventId);
        if (!event) {
          return res.status(404).json({ message: "Event not found" });
        }

        if (event.ownerId !== req.user!.id) {
          return res.status(403).json({
            message: "Not authorized to add participants to this event",
          });
        }

        const { userId, permission } = req.body;
        if (!userId) {
          return res.status(400).json({ message: "User ID is required" });
        }

        const participant = await storage.addEventParticipant({
          eventId,
          userId,
          permission: permission || "view",
        });

        res.status(201).json(participant);
      } catch (error) {
        res.status(500).json({ message: (error as Error).message });
      }
    }
  );

  app.delete(
    "/api/events/:eventId/participants/:userId",
    isAuthenticated,
    async (req, res) => {
      try {
        const eventId = parseInt(req.params.eventId);
        const participantId = parseInt(req.params.userId);

        if (isNaN(eventId) || isNaN(participantId)) {
          return res.status(400).json({ message: "Invalid IDs" });
        }

        const event = await storage.getEvent(eventId);
        if (!event) {
          return res.status(404).json({ message: "Event not found" });
        }

        if (event.ownerId !== req.user!.id) {
          return res.status(403).json({
            message: "Not authorized to remove participants from this event",
          });
        }

        await storage.removeEventParticipant(eventId, participantId);
        res.status(204).send();
      } catch (error) {
        res.status(500).json({ message: (error as Error).message });
      }
    }
  );

  app.put("/api/events/:id/permissions", isAuthenticated, async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const { userId, permission } = req.body;

      if (isNaN(eventId) || !userId || !permission) {
        return res.status(400).json({ message: "Invalid input" });
      }

      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      if (event.ownerId !== req.user!.id) {
        return res
          .status(403)
          .json({ message: "Not authorized to update permissions" });
      }

      const updatedParticipant = await storage.addEventParticipant({
        eventId,
        userId,
        permission,
      });

      res.status(200).json(updatedParticipant);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Comments
  app.get("/api/events/:id/comments", isAuthenticated, async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      if (isNaN(eventId)) {
        return res.status(400).json({ message: "Invalid event ID" });
      }

      const comments = await storage.getEventComments(eventId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/events/:id/comments", isAuthenticated, async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      if (isNaN(eventId)) {
        return res.status(400).json({ message: "Invalid event ID" });
      }

      const userId = req.user!.id;
      const { content, parentId } = req.body;

      if (!content) {
        return res.status(400).json({ message: "Comment content is required" });
      }

      const commentData = {
        eventId,
        userId,
        content,
        parentId: parentId || null,
      };

      // Validate comment data
      const validatedData = insertCommentSchema.parse(commentData);

      const comment = await storage.addComment(validatedData);
      res.status(201).json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid comment data", errors: error.format() });
      }
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Reactions
  app.post("/api/events/:id/reactions", isAuthenticated, async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      if (isNaN(eventId)) {
        return res.status(400).json({ message: "Invalid event ID" });
      }

      const userId = req.user!.id;
      const { type } = req.body;

      if (!type) {
        return res.status(400).json({ message: "Reaction type is required" });
      }

      const reactionData = { eventId, userId, type };

      // Validate reaction data
      const validatedData = insertReactionSchema.parse(reactionData);

      const reaction = await storage.addReaction(validatedData);
      res.status(201).json(reaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid reaction data", errors: error.format() });
      }
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.delete("/api/events/:id/reactions", isAuthenticated, async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      if (isNaN(eventId)) {
        return res.status(400).json({ message: "Invalid event ID" });
      }

      const userId = req.user!.id;

      await storage.removeReaction(eventId, userId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.get("/api/events/:id/reactions", isAuthenticated, async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      if (isNaN(eventId)) {
        return res.status(400).json({ message: "Invalid event ID" });
      }

      const reactions = await storage.getEventReactions(eventId);
      res.json(reactions);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Partners
  app.get("/api/partners", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;

      const partners = await storage.getPartners(userId);
      res.json(partners);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.get("/api/partners/requests", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;

      const requests = await storage.getPartnerRequests(userId);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/partners/invite", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { partnerEmail, shareAll, shareRaftOnly } = req.body;

      if (!partnerEmail) {
        return res.status(400).json({ message: "Partner email is required" });
      }

      // Find the user with the provided email
      const partnerUser = await storage.getUserByEmail(partnerEmail);
      if (!partnerUser) {
        return res
          .status(404)
          .json({ message: "User not found with the provided email" });
      }

      if (partnerUser.id === userId) {
        return res
          .status(400)
          .json({ message: "Cannot invite yourself as a partner" });
      }

      const partnerData = {
        userId,
        partnerId: partnerUser.id,
        status: "pending", // Set initial status to pending
        shareAll: shareAll !== undefined ? shareAll : true,
        shareRaftOnly: shareRaftOnly !== undefined ? shareRaftOnly : false,
      };

      // Validate partner data
      const validatedData = insertPartnerSchema.parse(partnerData);

      const invitation = await storage.createPartnerRequest(validatedData);
      res.status(201).json(invitation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid partner data", errors: error.format() });
      }
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.put("/api/partners/:id/status", isAuthenticated, async (req, res) => {
    try {
      const partnerId = parseInt(req.params.id);
      if (isNaN(partnerId)) {
        return res.status(400).json({ message: "Invalid partner ID" });
      }

      const { status } = req.body;
      if (!status || !["accepted", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }

      const partnerRequests = await storage.getPartnerRequests(req.user!.id);
      const partnerRequest = partnerRequests.find(
        (request) => request.id === partnerId
      );
      if (!partnerRequest) {
        return res.status(404).json({ message: "Partner request not found" });
      }

      // Ensure the current user is the invited partner
      if (partnerRequest.partnerId !== req.user!.id) {
        return res
          .status(403)
          .json({ message: "Not authorized to update this request" });
      }

      const updatedPartner = await storage.updatePartnerStatus(
        partnerId,
        status
      );

      // Automatically add partner to shared events if accepted
      if (status === "accepted") {
        await storage.addPartnerToSharedEvents(
          partnerRequest.userId,
          req.user!.id
        );
      }

      res.json(updatedPartner);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // External calendars
  app.get("/api/external-calendars", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;

      const calendars = await storage.getUserExternalCalendars(userId);
      res.json(calendars);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/external-calendars", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { provider, externalId, name, color, syncEnabled } = req.body;

      if (!provider || !externalId || !name) {
        return res
          .status(400)
          .json({ message: "Provider, externalId, and name are required" });
      }

      const calendarData = {
        userId,
        provider,
        externalId,
        name,
        color,
        syncEnabled: syncEnabled !== undefined ? syncEnabled : true,
      };

      // Validate calendar data
      const validatedData = insertExternalCalendarSchema.parse(calendarData);

      const calendar = await storage.addExternalCalendar(validatedData);
      res.status(201).json(calendar);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid calendar data", errors: error.format() });
      }
      res.status(500).json({ message: (error as Error).message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
