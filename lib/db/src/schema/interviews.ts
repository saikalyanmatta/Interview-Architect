import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { jobProfilesTable } from "./job-profiles";

export const interviewsTable = pgTable("interviews", {
  id: serial("id").primaryKey(),
  employerId: integer("employer_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  jobProfileId: integer("job_profile_id").notNull().references(() => jobProfilesTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  status: text("status", { enum: ["draft", "active", "closed"] }).notNull().default("draft"),
  difficulty: text("difficulty", { enum: ["easy", "medium", "hard"] }).notNull().default("medium"),
  interviewerTone: text("interviewer_tone", { enum: ["friendly", "professional", "strict", "casual"] }).notNull().default("professional"),
  numBehavioralQuestions: integer("num_behavioral_questions").notNull().default(3),
  numTechnicalQuestions: integer("num_technical_questions").notNull().default(3),
  numCodingQuestions: integer("num_coding_questions").notNull().default(2),
  allowedCodingLanguages: text("allowed_coding_languages").notNull().default("javascript,python,java"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const invitationsTable = pgTable("invitations", {
  id: serial("id").primaryKey(),
  interviewId: integer("interview_id").notNull().references(() => interviewsTable.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  status: text("status", { enum: ["pending", "completed"] }).notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertInterviewSchema = createInsertSchema(interviewsTable).omit({ id: true, createdAt: true });
export const insertInvitationSchema = createInsertSchema(invitationsTable).omit({ id: true, createdAt: true });
export type InsertInterview = z.infer<typeof insertInterviewSchema>;
export type InsertInvitation = z.infer<typeof insertInvitationSchema>;
export type Interview = typeof interviewsTable.$inferSelect;
export type Invitation = typeof invitationsTable.$inferSelect;
