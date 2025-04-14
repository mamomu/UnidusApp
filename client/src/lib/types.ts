import { 
  User as UserSchema, 
  Event as EventSchema,
  EventParticipant as EventParticipantSchema,
  Comment as CommentSchema,
  Reaction as ReactionSchema,
  Partner as PartnerSchema,
  ExternalCalendar as ExternalCalendarSchema
} from "@shared/schema";

// Extended types for frontend use
export interface User extends UserSchema {
  // Add any frontend-specific properties
}

export interface Event extends EventSchema {
  owner?: User;
  participants?: EventParticipant[];
  comments?: Comment[];
  reactions?: Reaction[];
}

export interface EventParticipant extends EventParticipantSchema {
  user?: User;
}

export interface Comment extends CommentSchema {
  user?: User;
  replies?: Comment[];
}

export interface Reaction extends ReactionSchema {
  user?: User;
}

export interface Partner extends PartnerSchema {
  partner: User;
}

export interface ExternalCalendar extends ExternalCalendarSchema {
  // Add any frontend-specific properties
}

// Form types
export interface EventFormData {
  title: string;
  date: string;
  startTime: string;
  endTime?: string;
  period: 'morning' | 'afternoon' | 'night';
  location?: string;
  emoji?: string;
  privacy: 'private' | 'partner' | 'public';
  recurrence: 'none' | 'daily' | 'weekly' | 'monthly' | 'custom';
  recurrenceEndDate?: string;
  isSpecial: boolean;
  participants?: {
    userId: number;
    permission: 'view' | 'edit';
  }[];
}

export interface PartnerInviteData {
  partnerEmail: string;
  shareAll: boolean;
  shareRaftOnly: boolean;
}

export interface CommentFormData {
  content: string;
  parentId?: number;
}

// View types
export type CalendarViewMode = 'day' | 'week' | 'month';
export type TimePeriod = 'morning' | 'afternoon' | 'night';
