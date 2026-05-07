import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { interviewsTable } from "./interviews";

export const sessionsTable = pgTable("sessions", {
  id: serial("id").primaryKey(),
  interviewId: integer("interview_id").notNull().references(() => interviewsTable.id, { onDelete: "cascade" }),
  candidateEmail: text("candidate_email").notNull(),
  candidateName: text("candidate_name").notNull(),
  status: text("status", { enum: ["in_progress", "completed", "abandoned"] }).notNull().default("in_progress"),
  difficulty: text("difficulty", { enum: ["easy", "medium", "hard"] }).notNull().default("medium"),
  interviewerTone: text("interviewer_tone", { enum: ["friendly", "professional", "strict", "casual"] }).notNull().default("professional"),
  codingLanguage: text("coding_language"),
  overallScore: integer("overall_score"),
  currentQuestionIndex: integer("current_question_index").notNull().default(0),
  totalQuestions: integer("total_questions").notNull().default(0),
  phase: text("phase", { enum: ["intro", "behavioral", "technical", "coding", "completed"] }).notNull().default("intro"),
  overallFeedback: text("overall_feedback"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const questionsTable = pgTable("questions", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => sessionsTable.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["intro", "behavioral", "technical", "coding"] }).notNull(),
  content: text("content").notNull(),
  difficulty: text("difficulty", { enum: ["easy", "medium", "hard"] }).notNull().default("medium"),
  orderIndex: integer("order_index").notNull(),
  skillTag: text("skill_tag"),
});

export const answersTable = pgTable("answers", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => sessionsTable.id, { onDelete: "cascade" }),
  questionId: integer("question_id").notNull().references(() => questionsTable.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  score: integer("score"),
  feedback: text("feedback"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const codingQuestionsTable = pgTable("coding_questions", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => sessionsTable.id, { onDelete: "cascade" }),
  language: text("language").notNull(),
  problem: text("problem").notNull(),
  difficulty: text("difficulty", { enum: ["easy", "medium", "hard"] }).notNull().default("medium"),
  orderIndex: integer("order_index").notNull(),
  exampleInput: text("example_input"),
  exampleOutput: text("example_output"),
});

export const codingAnswersTable = pgTable("coding_answers", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => sessionsTable.id, { onDelete: "cascade" }),
  codingQuestionId: integer("coding_question_id").notNull().references(() => codingQuestionsTable.id, { onDelete: "cascade" }),
  code: text("code").notNull(),
  language: text("language").notNull(),
  score: integer("score"),
  feedback: text("feedback"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSessionSchema = createInsertSchema(sessionsTable).omit({ id: true, startedAt: true });
export const insertQuestionSchema = createInsertSchema(questionsTable).omit({ id: true });
export const insertAnswerSchema = createInsertSchema(answersTable).omit({ id: true, createdAt: true });
export const insertCodingQuestionSchema = createInsertSchema(codingQuestionsTable).omit({ id: true });
export const insertCodingAnswerSchema = createInsertSchema(codingAnswersTable).omit({ id: true, createdAt: true });

export type Session = typeof sessionsTable.$inferSelect;
export type Question = typeof questionsTable.$inferSelect;
export type Answer = typeof answersTable.$inferSelect;
export type CodingQuestion = typeof codingQuestionsTable.$inferSelect;
export type CodingAnswer = typeof codingAnswersTable.$inferSelect;
