import { Router, type IRouter, type Request, type Response } from "express";
import { db, interviewsTable, sessionsTable, questionsTable, answersTable, codingQuestionsTable, codingAnswersTable, jobProfilesTable, jobProfileSkillsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CheckCandidateAccessBody,
  CreateSessionBody,
  GetSessionParams,
  GetNextQuestionParams,
  SubmitAnswerBody,
  SubmitAnswerParams,
  GetCodingQuestionsParams,
  SubmitCodingAnswerBody,
  SubmitCodingAnswerParams,
  CompleteSessionParams,
  GetSessionResultsParams,
  ParseResumeBody,
} from "@workspace/api-zod";
import { openai } from "@workspace/integrations-openai-ai-server";

const router: IRouter = Router();

// Resume parsing
router.post("/candidate/parse-resume", async (req, res): Promise<void> => {
  const parsed = ParseResumeBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { resumeText } = parsed.data;
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        {
          role: "system",
          content: `You are a resume parser. Extract technical and soft skills from the resume text, suggest a job role, and provide a brief summary. Respond with JSON only.`,
        },
        {
          role: "user",
          content: `Parse this resume and extract skills:\n\n${resumeText}\n\nRespond with JSON in this exact format:\n{"skills": ["skill1", "skill2", ...], "suggestedRole": "role title", "summary": "2-3 sentence summary"}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(completion.choices[0].message.content ?? "{}");
    res.json({
      skills: result.skills ?? [],
      suggestedRole: result.suggestedRole ?? "Software Engineer",
      summary: result.summary ?? "",
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to parse resume" });
  }
});

// Create a self-service practice interview session
const PRACTICE_SYSTEM_USER_ID = "practice-system-user";

router.post("/candidate/practice-sessions", async (req, res): Promise<void> => {
  const {
    targetRole = "Software Engineer",
    skills = [],
    difficulty = "medium",
    interviewerTone = "professional",
    numBehavioralQuestions = 2,
    numTechnicalQuestions = 3,
    numCodingQuestions = 1,
    codingLanguage = "javascript",
    adaptive = false,
  } = req.body;

  try {
    // Ensure system user exists
    await db.insert(usersTable).values({
      id: PRACTICE_SYSTEM_USER_ID,
      email: "system@interviewai.internal",
      name: "InterviewAI System",
      role: "system",
    }).onConflictDoNothing();

    // Create job profile for this practice session
    const [jobProfile] = await db.insert(jobProfilesTable).values({
      employerId: PRACTICE_SYSTEM_USER_ID,
      title: targetRole,
      description: `Practice interview for ${targetRole} role.`,
    }).returning();

    // Insert skills into job profile
    if (Array.isArray(skills) && skills.length > 0) {
      await db.insert(jobProfileSkillsTable).values(
        skills.slice(0, 20).map((skill: string) => ({
          jobProfileId: jobProfile.id,
          skillName: String(skill).trim(),
          proficiencyLevel: "intermediate" as const,
          weightage: 10,
        }))
      );
    }

    // Create the interview
    const [interview] = await db.insert(interviewsTable).values({
      employerId: PRACTICE_SYSTEM_USER_ID,
      jobProfileId: jobProfile.id,
      title: `Practice: ${targetRole}`,
      status: "active" as const,
      difficulty: difficulty as any,
      interviewerTone: interviewerTone as any,
      numBehavioralQuestions: Math.max(0, Math.min(8, Number(numBehavioralQuestions))),
      numTechnicalQuestions: Math.max(0, Math.min(8, Number(numTechnicalQuestions))),
      numCodingQuestions: Math.max(0, Math.min(3, Number(numCodingQuestions))),
      allowedCodingLanguages: codingLanguage,
    }).returning();

    // Create the session
    const bNum = Math.max(0, Math.min(8, Number(numBehavioralQuestions)));
    const tNum = Math.max(0, Math.min(8, Number(numTechnicalQuestions)));
    const totalQuestions = 1 + bNum + tNum;

    const candidateEmail = req.isAuthenticated()
      ? (req.user.email ?? "candidate@practice")
      : "candidate@practice";
    const candidateName = req.isAuthenticated()
      ? ([req.user.firstName, req.user.lastName].filter(Boolean).join(" ") || req.user.email?.split("@")[0] || "Candidate")
      : "Candidate";

    const [session] = await db.insert(sessionsTable).values({
      interviewId: interview.id,
      candidateEmail,
      candidateName,
      difficulty: difficulty as any,
      interviewerTone: interviewerTone as any,
      codingLanguage,
      totalQuestions,
      phase: "intro" as const,
    }).returning();

    res.status(201).json(session);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to create practice session", detail: err?.message });
  }
});

// List public active interviews for candidates to browse
router.get("/candidate/interviews", async (req, res): Promise<void> => {
  const activeInterviews = await db.select().from(interviewsTable)
    .where(eq(interviewsTable.status, "active"));

  const result = await Promise.all(activeInterviews.map(async (interview) => {
    const [profile] = await db.select().from(jobProfilesTable).where(eq(jobProfilesTable.id, interview.jobProfileId));
    const skills = await db.select().from(jobProfileSkillsTable).where(eq(jobProfileSkillsTable.jobProfileId, interview.jobProfileId));
    return {
      id: interview.id,
      title: interview.title,
      jobProfileTitle: profile?.title ?? "",
      difficulty: interview.difficulty,
      interviewerTone: interview.interviewerTone,
      numBehavioralQuestions: interview.numBehavioralQuestions,
      numTechnicalQuestions: interview.numTechnicalQuestions,
      numCodingQuestions: interview.numCodingQuestions,
      skills: skills.map((s) => s.skillName),
    };
  }));

  res.json(result);
});

// Get single public interview details
router.get("/candidate/interviews/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid interview ID" }); return; }

  const [interview] = await db.select().from(interviewsTable).where(eq(interviewsTable.id, id));
  if (!interview || interview.status !== "active") { res.status(404).json({ error: "Interview not found" }); return; }

  const [profile] = await db.select().from(jobProfilesTable).where(eq(jobProfilesTable.id, interview.jobProfileId));
  const skills = await db.select().from(jobProfileSkillsTable).where(eq(jobProfileSkillsTable.jobProfileId, interview.jobProfileId));

  res.json({ interview, jobProfile: { ...profile, skills } });
});

// Check if candidate has access (kept for backward compat, now always grants access if interview is active)
router.post("/candidate/check-access", async (req, res): Promise<void> => {
  const parsed = CheckCandidateAccessBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { interviewId } = parsed.data;

  const [interview] = await db.select().from(interviewsTable).where(eq(interviewsTable.id, interviewId));
  if (!interview || interview.status !== "active") { res.json({ hasAccess: false }); return; }

  const [profile] = await db.select().from(jobProfilesTable).where(eq(jobProfilesTable.id, interview.jobProfileId));
  const skills = await db.select().from(jobProfileSkillsTable).where(eq(jobProfileSkillsTable.jobProfileId, interview.jobProfileId));

  res.json({ hasAccess: true, interview, jobProfile: { ...profile, skills } });
});

// Start session
router.post("/candidate/sessions", async (req, res): Promise<void> => {
  const parsed = CreateSessionBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { interviewId, candidateEmail, candidateName, difficulty, interviewerTone, codingLanguage } = parsed.data;

  const emailToUse = req.isAuthenticated()
    ? (req.user.email ?? candidateEmail ?? "").trim().toLowerCase()
    : candidateEmail.trim().toLowerCase();
  const nameToUse = req.isAuthenticated()
    ? ([req.user.firstName, req.user.lastName].filter(Boolean).join(" ") || candidateName)
    : candidateName;

  const [interview] = await db.select().from(interviewsTable).where(eq(interviewsTable.id, interviewId));
  if (!interview) { res.status(404).json({ error: "Interview not found" }); return; }
  if (interview.status !== "active") { res.status(403).json({ error: "This interview is not currently active" }); return; }

  const totalQuestions = 1 + interview.numBehavioralQuestions + interview.numTechnicalQuestions;

  const [session] = await db.insert(sessionsTable).values({
    interviewId,
    candidateEmail: emailToUse,
    candidateName: nameToUse,
    difficulty: difficulty as any,
    interviewerTone: interviewerTone as any,
    codingLanguage: codingLanguage ?? interview.allowedCodingLanguages.split(",")[0] ?? "javascript",
    totalQuestions,
    phase: "intro",
  }).returning();

  res.status(201).json(session);
});

// Get session
router.get("/candidate/sessions/:id", async (req, res): Promise<void> => {
  const params = GetSessionParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.id, params.data.id));
  if (!session) { res.status(404).json({ error: "Not found" }); return; }
  res.json(session);
});

// Get next question (adaptive)
router.post("/candidate/sessions/:id/next-question", async (req, res): Promise<void> => {
  const params = GetNextQuestionParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.id, params.data.id));
  if (!session) { res.status(404).json({ error: "Not found" }); return; }

  if (session.phase === "completed") {
    res.json({ sessionComplete: true, phase: "completed" });
    return;
  }

  const [interview] = await db.select().from(interviewsTable).where(eq(interviewsTable.id, session.interviewId));
  const [jobProfile] = await db.select().from(jobProfilesTable).where(eq(jobProfilesTable.id, interview.jobProfileId));
  const skills = await db.select().from(jobProfileSkillsTable).where(eq(jobProfileSkillsTable.jobProfileId, interview.jobProfileId));

  const existingQuestions = await db.select().from(questionsTable).where(eq(questionsTable.sessionId, session.id));
  const existingAnswers = await db.select().from(answersTable).where(eq(answersTable.sessionId, session.id));

  // Determine current phase
  let currentPhase = session.phase;
  let nextPhase = currentPhase;

  const introQuestions = existingQuestions.filter((q) => q.type === "intro");
  const behavioralQuestions = existingQuestions.filter((q) => q.type === "behavioral");
  const technicalQuestions = existingQuestions.filter((q) => q.type === "technical");

  // Check if we should advance phase
  if (currentPhase === "intro" && introQuestions.length > 0 && existingAnswers.filter((a) => introQuestions.some((q) => q.id === a.questionId)).length >= introQuestions.length) {
    nextPhase = interview.numBehavioralQuestions > 0 ? "behavioral" : "technical";
  } else if (currentPhase === "behavioral" && behavioralQuestions.length >= interview.numBehavioralQuestions && existingAnswers.filter((a) => behavioralQuestions.some((q) => q.id === a.questionId)).length >= behavioralQuestions.length) {
    nextPhase = interview.numTechnicalQuestions > 0 ? "technical" : "coding";
  } else if (currentPhase === "technical" && technicalQuestions.length >= interview.numTechnicalQuestions && existingAnswers.filter((a) => technicalQuestions.some((q) => q.id === a.questionId)).length >= technicalQuestions.length) {
    nextPhase = interview.numCodingQuestions > 0 ? "coding" : "completed";
  }

  if (nextPhase !== currentPhase) {
    await db.update(sessionsTable).set({ phase: nextPhase as any }).where(eq(sessionsTable.id, session.id));
    currentPhase = nextPhase;
  }

  if (currentPhase === "coding") {
    // Move to coding phase - signal frontend to go to coding page
    res.json({ sessionComplete: false, phase: "coding", questionNumber: session.currentQuestionIndex, totalQuestions: session.totalQuestions });
    return;
  }

  if (currentPhase === "completed") {
    res.json({ sessionComplete: true, phase: "completed" });
    return;
  }

  // Determine adaptive difficulty based on recent performance
  let adaptiveDifficulty = session.difficulty;
  if (existingAnswers.length >= 2) {
    const recentAnswers = existingAnswers.slice(-3);
    const avgScore = recentAnswers.reduce((sum, a) => sum + (a.score ?? 50), 0) / recentAnswers.length;
    if (avgScore >= 80 && session.difficulty === "easy") adaptiveDifficulty = "medium";
    else if (avgScore >= 80 && session.difficulty === "medium") adaptiveDifficulty = "hard";
    else if (avgScore <= 40 && session.difficulty === "hard") adaptiveDifficulty = "medium";
    else if (avgScore <= 40 && session.difficulty === "medium") adaptiveDifficulty = "easy";
  }

  // Determine which questions already exist for current phase
  const phaseQuestions = existingQuestions.filter((q) => q.type === currentPhase);
  const phaseAnswers = existingAnswers.filter((a) => phaseQuestions.some((q) => q.id === a.questionId));
  const unansweredQuestion = phaseQuestions.find((q) => !existingAnswers.some((a) => a.questionId === q.id));

  if (unansweredQuestion) {
    await db.update(sessionsTable).set({ currentQuestionIndex: session.currentQuestionIndex + 1 }).where(eq(sessionsTable.id, session.id));
    res.json({
      question: unansweredQuestion,
      sessionComplete: false,
      phase: currentPhase,
      questionNumber: session.currentQuestionIndex + 1,
      totalQuestions: session.totalQuestions,
    });
    return;
  }

  // Need to generate a new question
  const maxForPhase = currentPhase === "intro" ? 1 : currentPhase === "behavioral" ? interview.numBehavioralQuestions : interview.numTechnicalQuestions;
  if (phaseQuestions.length >= maxForPhase) {
    // Phase is done, check next phase
    let next = currentPhase === "intro" ? "behavioral" : currentPhase === "behavioral" ? "technical" : "coding";
    if (currentPhase === "behavioral" && interview.numTechnicalQuestions === 0) next = "coding";
    if (currentPhase === "technical") next = interview.numCodingQuestions > 0 ? "coding" : "completed";

    await db.update(sessionsTable).set({ phase: next as any }).where(eq(sessionsTable.id, session.id));

    if (next === "coding") {
      res.json({ sessionComplete: false, phase: "coding", questionNumber: session.currentQuestionIndex, totalQuestions: session.totalQuestions });
      return;
    }
    if (next === "completed") {
      res.json({ sessionComplete: true, phase: "completed" });
      return;
    }
    currentPhase = next;
  }

  // Generate question with AI
  const skillNames = skills.map((s) => s.skillName).join(", ");
  const previousQs = existingQuestions.map((q) => q.content).join("\n- ");

  const toneInstructions: Record<string, string> = {
    friendly: "Ask in a warm, encouraging way.",
    professional: "Ask in a formal, business-like manner.",
    strict: "Ask in a direct, challenging way with high expectations.",
    casual: "Ask in a relaxed, conversational tone.",
  };

  let systemPrompt = "";
  let userPrompt = "";

  if (currentPhase === "intro") {
    systemPrompt = `You are an interviewer for a ${jobProfile.title} position. ${toneInstructions[session.interviewerTone] ?? ""}`;
    userPrompt = `Generate a single, specific self-introduction question for the candidate. The job requires: ${skillNames}. Return ONLY the question text, nothing else.`;
  } else if (currentPhase === "behavioral") {
    systemPrompt = `You are an interviewer for a ${jobProfile.title} position. ${toneInstructions[session.interviewerTone] ?? ""} Focus on behavioral questions.`;
    userPrompt = `Generate a single ${adaptiveDifficulty} difficulty behavioral interview question for a ${jobProfile.title} role.
Job skills required: ${skillNames}.
${previousQs ? `Already asked:\n- ${previousQs}` : ""}
Return ONLY the question text, nothing else.`;
  } else {
    const skillToAsk = skills[phaseQuestions.length % skills.length];
    systemPrompt = `You are a technical interviewer for a ${jobProfile.title} position. ${toneInstructions[session.interviewerTone] ?? ""}`;
    userPrompt = `Generate a single ${adaptiveDifficulty} difficulty technical interview question testing ${skillToAsk?.skillName ?? skillNames} for a ${jobProfile.title} role.
${previousQs ? `Already asked:\n- ${previousQs}` : ""}
Return ONLY the question text, nothing else.`;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1",
      max_completion_tokens: 256,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const questionContent = completion.choices[0]?.message?.content?.trim() ?? "Tell me about yourself and your experience.";
    const skillToTag = currentPhase === "technical" ? skills[phaseQuestions.length % skills.length]?.skillName : undefined;

    const [question] = await db.insert(questionsTable).values({
      sessionId: session.id,
      type: currentPhase as any,
      content: questionContent,
      difficulty: adaptiveDifficulty as any,
      orderIndex: existingQuestions.length,
      skillTag: skillToTag,
    }).returning();

    await db.update(sessionsTable).set({ currentQuestionIndex: session.currentQuestionIndex + 1 }).where(eq(sessionsTable.id, session.id));

    res.json({
      question,
      sessionComplete: false,
      phase: currentPhase,
      questionNumber: session.currentQuestionIndex + 1,
      totalQuestions: session.totalQuestions,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate question" });
  }
});

// Submit answer
router.post("/candidate/sessions/:id/answers", async (req, res): Promise<void> => {
  const params = SubmitAnswerParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = SubmitAnswerBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.id, params.data.id));
  if (!session) { res.status(404).json({ error: "Not found" }); return; }

  const [question] = await db.select().from(questionsTable).where(eq(questionsTable.id, parsed.data.questionId));
  if (!question) { res.status(404).json({ error: "Question not found" }); return; }

  // AI evaluate answer
  let score: number | null = null;
  let feedback: string | null = null;

  try {
    const [interview] = await db.select().from(interviewsTable).where(eq(interviewsTable.id, session.interviewId));
    const [jobProfile] = await db.select().from(jobProfilesTable).where(eq(jobProfilesTable.id, interview.jobProfileId));

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1",
      max_completion_tokens: 512,
      messages: [
        {
          role: "system",
          content: `You are evaluating an interview answer for a ${jobProfile.title} position. Provide a score from 0-100 and brief feedback. Respond in JSON format: {"score": number, "feedback": "string"}`,
        },
        {
          role: "user",
          content: `Question: ${question.content}\nAnswer: ${parsed.data.content}\nDifficulty: ${question.difficulty}`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "{}";
    const parsed2 = JSON.parse(raw.replace(/```json\n?/g, "").replace(/```\n?/g, ""));
    score = Math.min(100, Math.max(0, Math.round(Number(parsed2.score) || 0)));
    feedback = parsed2.feedback ?? null;
  } catch {
    // non-blocking evaluation failure
  }

  const [answer] = await db.insert(answersTable).values({
    sessionId: session.id,
    questionId: parsed.data.questionId,
    content: parsed.data.content,
    score,
    feedback,
  }).returning();

  res.status(201).json(answer);
});

// Get coding questions
router.get("/candidate/sessions/:id/coding-questions", async (req, res): Promise<void> => {
  const params = GetCodingQuestionsParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const existing = await db.select().from(codingQuestionsTable).where(eq(codingQuestionsTable.sessionId, params.data.id));
  res.json(existing);
});

// Submit coding answer
router.post("/candidate/sessions/:id/coding-answers", async (req, res): Promise<void> => {
  const params = SubmitCodingAnswerParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = SubmitCodingAnswerBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.id, params.data.id));
  if (!session) { res.status(404).json({ error: "Not found" }); return; }

  let score: number | null = null;
  let feedback: string | null = null;

  try {
    const [codingQ] = await db.select().from(codingQuestionsTable).where(eq(codingQuestionsTable.id, parsed.data.codingQuestionId));
    if (codingQ) {
      const completion = await openai.chat.completions.create({
        model: "gpt-4.1",
        max_completion_tokens: 512,
        messages: [
          {
            role: "system",
            content: `You are a code reviewer. Evaluate this ${parsed.data.language} code solution. Score from 0-100. Reply in JSON: {"score": number, "feedback": "string"}`,
          },
          {
            role: "user",
            content: `Problem: ${codingQ.problem}\n\nCode:\n${parsed.data.code}`,
          },
        ],
      });
      const raw = completion.choices[0]?.message?.content?.trim() ?? "{}";
      const ev = JSON.parse(raw.replace(/```json\n?/g, "").replace(/```\n?/g, ""));
      score = Math.min(100, Math.max(0, Math.round(Number(ev.score) || 0)));
      feedback = ev.feedback ?? null;
    }
  } catch {}

  const [codingAnswer] = await db.insert(codingAnswersTable).values({
    sessionId: session.id,
    codingQuestionId: parsed.data.codingQuestionId,
    code: parsed.data.code,
    language: parsed.data.language,
    score,
    feedback,
  }).returning();

  res.status(201).json(codingAnswer);
});

// Complete session
router.post("/candidate/sessions/:id/complete", async (req, res): Promise<void> => {
  const params = CompleteSessionParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.id, params.data.id));
  if (!session) { res.status(404).json({ error: "Not found" }); return; }

  const answers = await db.select().from(answersTable).where(eq(answersTable.sessionId, session.id));
  const codingAnswers = await db.select().from(codingAnswersTable).where(eq(codingAnswersTable.sessionId, session.id));
  const questions = await db.select().from(questionsTable).where(eq(questionsTable.sessionId, session.id));

  const [interview] = await db.select().from(interviewsTable).where(eq(interviewsTable.id, session.interviewId));
  const skills = await db.select().from(jobProfileSkillsTable).where(eq(jobProfileSkillsTable.jobProfileId, interview.jobProfileId));

  const allScores = [
    ...answers.map((a) => a.score ?? 0),
    ...codingAnswers.map((a) => a.score ?? 0),
  ];
  const overallScore = allScores.length > 0 ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0;

  // Generate overall feedback
  let overallFeedback: string | null = null;
  try {
    const summaryText = answers.map((a) => {
      const q = questions.find((q) => q.id === a.questionId);
      return `Q: ${q?.content}\nA: ${a.content}\nScore: ${a.score ?? "N/A"}`;
    }).join("\n\n");

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1",
      max_completion_tokens: 512,
      messages: [
        { role: "system", content: "You are an interview evaluator. Give a concise overall feedback summary (2-3 sentences) for this candidate." },
        { role: "user", content: `Overall score: ${overallScore}/100\n\n${summaryText}` },
      ],
    });
    overallFeedback = completion.choices[0]?.message?.content?.trim() ?? null;
  } catch {}

  const [updatedSession] = await db.update(sessionsTable).set({
    status: "completed",
    phase: "completed",
    overallScore,
    overallFeedback,
    completedAt: new Date(),
  }).where(eq(sessionsTable.id, session.id)).returning();

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

  res.json({ session: updatedSession, answers, codingAnswers, skillScores, overallFeedback });
});

// Get session results
router.get("/candidate/sessions/:id/results", async (req, res): Promise<void> => {
  const params = GetSessionResultsParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.id, params.data.id));
  if (!session) { res.status(404).json({ error: "Not found" }); return; }

  const answers = await db.select().from(answersTable).where(eq(answersTable.sessionId, session.id));
  const codingAnswers = await db.select().from(codingAnswersTable).where(eq(codingAnswersTable.sessionId, session.id));
  const questions = await db.select().from(questionsTable).where(eq(questionsTable.sessionId, session.id));

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

export default router;
