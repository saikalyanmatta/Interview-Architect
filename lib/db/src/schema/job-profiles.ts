import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const jobProfilesTable = pgTable("job_profiles", {
  id: serial("id").primaryKey(),
  employerId: integer("employer_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const jobProfileSkillsTable = pgTable("job_profile_skills", {
  id: serial("id").primaryKey(),
  jobProfileId: integer("job_profile_id").notNull().references(() => jobProfilesTable.id, { onDelete: "cascade" }),
  skillName: text("skill_name").notNull(),
  proficiencyLevel: text("proficiency_level", { enum: ["beginner", "intermediate", "advanced", "expert"] }).notNull(),
  weightage: integer("weightage").notNull().default(10),
});

export const insertJobProfileSchema = createInsertSchema(jobProfilesTable).omit({ id: true, createdAt: true });
export const insertJobProfileSkillSchema = createInsertSchema(jobProfileSkillsTable).omit({ id: true });
export type InsertJobProfile = z.infer<typeof insertJobProfileSchema>;
export type InsertJobProfileSkill = z.infer<typeof insertJobProfileSkillSchema>;
export type JobProfile = typeof jobProfilesTable.$inferSelect;
export type JobProfileSkill = typeof jobProfileSkillsTable.$inferSelect;
