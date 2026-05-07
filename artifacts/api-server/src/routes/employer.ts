import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { db, jobProfilesTable, jobProfileSkillsTable, interviewsTable, invitationsTable, sessionsTable, answersTable, questionsTable, codingAnswersTable, codingQuestionsTable } from "@workspace/db";
import { eq, and, count, sql } from "drizzle-orm";
import {
  CreateJobProfileBody,
  UpdateJobProfileBody,
  CreateInterviewBody,
  UpdateInterviewBody,
  AddInvitationsBody,
  GetJobProfileParams,
  GetInterviewParams,
  UpdateJobProfileParams,
  DeleteJobProfileParams,
  UpdateInterviewParams,
  DeleteInterviewParams,
  ListInvitationsParams,
  AddInvitationsParams,
  ListInterviewSessionsParams,
  GetEmployerSessionParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.isAuthenticated?.()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

router.use(requireAuth);

// Job Profiles
router.get("/employer/job-profiles", async (req: any, res): Promise<void> => {
  const profiles = await db.select().from(jobProfilesTable).where(eq(jobProfilesTable.employerId, req.user.id));
  res.json(profiles);
});

router.post("/employer/job-profiles", async (req: any, res): Promise<void> => {
  const parsed = CreateJobProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { skills, ...profileData } = parsed.data;
  const [profile] = await db.insert(jobProfilesTable).values({ ...profileData, employerId: req.user.id }).returning();

  if (skills.length > 0) {
    await db.insert(jobProfileSkillsTable).values(skills.map((s: any) => ({ ...s, jobProfileId: profile.id })));
  }

  const skillRows = await db.select().from(jobProfileSkillsTable).where(eq(jobProfileSkillsTable.jobProfileId, profile.id));
  res.status(201).json({ ...profile, skills: skillRows });
});

router.get("/employer/job-profiles/:id", async (req: any, res): Promise<void> => {
  const params = GetJobProfileParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [profile] = await db.select().from(jobProfilesTable)
    .where(and(eq(jobProfilesTable.id, params.data.id), eq(jobProfilesTable.employerId, req.user.id)));
  if (!profile) { res.status(404).json({ error: "Not found" }); return; }

  const skills = await db.select().from(jobProfileSkillsTable).where(eq(jobProfileSkillsTable.jobProfileId, profile.id));
  res.json({ ...profile, skills });
});

router.put("/employer/job-profiles/:id", async (req: any, res): Promise<void> => {
  const params = UpdateJobProfileParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateJobProfileBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { skills, ...profileData } = parsed.data;

  const [profile] = await db.update(jobProfilesTable)
    .set(profileData)
    .where(and(eq(jobProfilesTable.id, params.data.id), eq(jobProfilesTable.employerId, req.user.id)))
    .returning();
  if (!profile) { res.status(404).json({ error: "Not found" }); return; }

  if (skills) {
    await db.delete(jobProfileSkillsTable).where(eq(jobProfileSkillsTable.jobProfileId, profile.id));
    if (skills.length > 0) {
      await db.insert(jobProfileSkillsTable).values(skills.map((s: any) => ({ ...s, jobProfileId: profile.id })));
    }
  }

  const skillRows = await db.select().from(jobProfileSkillsTable).where(eq(jobProfileSkillsTable.jobProfileId, profile.id));
  res.json({ ...profile, skills: skillRows });
});

router.delete("/employer/job-profiles/:id", async (req: any, res): Promise<void> => {
  const params = DeleteJobProfileParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  await db.delete(jobProfilesTable)
    .where(and(eq(jobProfilesTable.id, params.data.id), eq(jobProfilesTable.employerId, req.user.id)));
  res.sendStatus(204);
});

// Interviews
router.get("/employer/interviews", async (req: any, res): Promise<void> => {
  const interviews = await db.select().from(interviewsTable).where(eq(interviewsTable.employerId, req.user.id));
  res.json(interviews);
});

router.post("/employer/interviews", async (req: any, res): Promise<void> => {
  const parsed = CreateInterviewBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [interview] = await db.insert(interviewsTable).values({
    ...parsed.data,
    employerId: req.user.id,
    status: "active",
  }).returning();
  res.status(201).json(interview);
});

router.get("/employer/interviews/:id", async (req: any, res): Promise<void> => {
  const params = GetInterviewParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [interview] = await db.select().from(interviewsTable)
    .where(and(eq(interviewsTable.id, params.data.id), eq(interviewsTable.employerId, req.user.id)));
  if (!interview) { res.status(404).json({ error: "Not found" }); return; }

  const [profile] = await db.select().from(jobProfilesTable).where(eq(jobProfilesTable.id, interview.jobProfileId));
  const skills = await db.select().from(jobProfileSkillsTable).where(eq(jobProfileSkillsTable.jobProfileId, interview.jobProfileId));
  const invitations = await db.select().from(invitationsTable).where(eq(invitationsTable.interviewId, interview.id));
  const sessionCountResult = await db.select({ count: count() }).from(sessionsTable).where(eq(sessionsTable.interviewId, interview.id));

  res.json({
    ...interview,
    jobProfile: { ...profile, skills },
    invitations,
    sessionCount: sessionCountResult[0]?.count ?? 0,
  });
});

router.put("/employer/interviews/:id", async (req: any, res): Promise<void> => {
  const params = UpdateInterviewParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateInterviewBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [interview] = await db.update(interviewsTable)
    .set(parsed.data)
    .where(and(eq(interviewsTable.id, params.data.id), eq(interviewsTable.employerId, req.user.id)))
    .returning();
  if (!interview) { res.status(404).json({ error: "Not found" }); return; }
  res.json(interview);
});

router.delete("/employer/interviews/:id", async (req: any, res): Promise<void> => {
  const params = DeleteInterviewParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  await db.delete(interviewsTable)
    .where(and(eq(interviewsTable.id, params.data.id), eq(interviewsTable.employerId, req.user.id)));
  res.sendStatus(204);
});

// Invitations
router.get("/employer/interviews/:id/invitations", async (req: any, res): Promise<void> => {
  const params = ListInvitationsParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const invitations = await db.select().from(invitationsTable).where(eq(invitationsTable.interviewId, params.data.id));
  res.json(invitations);
});

router.post("/employer/interviews/:id/invitations", async (req: any, res): Promise<void> => {
  const params = AddInvitationsParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = AddInvitationsBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const emails = [...new Set(parsed.data.emails.map((e: string) => e.trim().toLowerCase()).filter(Boolean))];
  if (emails.length === 0) { res.status(400).json({ error: "No valid emails provided" }); return; }

  const existing = await db.select().from(invitationsTable).where(eq(invitationsTable.interviewId, params.data.id));
  const existingEmails = new Set(existing.map((i) => i.email));
  const newEmails = emails.filter((e) => !existingEmails.has(e));

  let newInvitations: any[] = [];
  if (newEmails.length > 0) {
    newInvitations = await db.insert(invitationsTable)
      .values(newEmails.map((email) => ({ interviewId: params.data.id, email })))
      .returning();
  }

  res.status(201).json(newInvitations);
});

// Sessions for employer
router.get("/employer/interviews/:id/sessions", async (req: any, res): Promise<void> => {
  const params = ListInterviewSessionsParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const sessions = await db.select().from(sessionsTable).where(eq(sessionsTable.interviewId, params.data.id));
  res.json(sessions);
});

router.get("/employer/sessions/:id", async (req: any, res): Promise<void> => {
  const params = GetEmployerSessionParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.id, params.data.id));
  if (!session) { res.status(404).json({ error: "Not found" }); return; }

  const questions = await db.select().from(questionsTable).where(eq(questionsTable.sessionId, session.id));
  const answers = await db.select().from(answersTable).where(eq(answersTable.sessionId, session.id));
  const codingAnswers = await db.select().from(codingAnswersTable).where(eq(codingAnswersTable.sessionId, session.id));

  const [interview] = await db.select().from(interviewsTable).where(eq(interviewsTable.id, session.interviewId));
  const skills = await db.select().from(jobProfileSkillsTable).where(eq(jobProfileSkillsTable.jobProfileId, interview.jobProfileId));

  const skillScores = skills.map((skill) => {
    const relevantAnswers = answers.filter((a) => {
      const q = questions.find((q) => q.id === a.questionId);
      return q?.skillTag === skill.skillName;
    });
    const avgScore = relevantAnswers.length > 0
      ? Math.round(relevantAnswers.reduce((sum, a) => sum + (a.score ?? 0), 0) / relevantAnswers.length)
      : 0;
    return { skillName: skill.skillName, score: avgScore, weightage: skill.weightage };
  });

  res.json({ session, answers, codingAnswers, skillScores, overallFeedback: session.overallFeedback });
});

// Employer stats
router.get("/employer/stats", async (req: any, res): Promise<void> => {
  const interviews = await db.select().from(interviewsTable).where(eq(interviewsTable.employerId, req.user.id));
  const interviewIds = interviews.map((i) => i.id);

  let totalSessions = 0;
  let completedSessions = 0;
  let avgScore: number | null = null;

  if (interviewIds.length > 0) {
    const sessions = await db.select().from(sessionsTable)
      .where(sql`${sessionsTable.interviewId} = ANY(${sql`ARRAY[${sql.join(interviewIds.map(id => sql`${id}`), sql`, `)}]`})`);
    totalSessions = sessions.length;
    completedSessions = sessions.filter((s) => s.status === "completed").length;
    const scores = sessions.filter((s) => s.overallScore !== null).map((s) => s.overallScore as number);
    if (scores.length > 0) {
      avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    }
  }

  const jobProfiles = await db.select().from(jobProfilesTable).where(eq(jobProfilesTable.employerId, req.user.id));
  const activeInterviews = interviews.filter((i) => i.status === "active").length;

  res.json({
    totalInterviews: interviews.length,
    activeInterviews,
    totalSessions,
    completedSessions,
    totalJobProfiles: jobProfiles.length,
    avgScore,
  });
});

export default router;
