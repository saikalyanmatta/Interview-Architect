import { Router, type IRouter } from "express";
import { db, sessionsTable, interviewsTable, jobProfilesTable, jobProfileSkillsTable, codingQuestionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { TextToSpeechBody, GenerateCodingQuestionsBody } from "@workspace/api-zod";
import { openai } from "@workspace/integrations-openai-ai-server";
import { textToSpeech } from "@workspace/integrations-openai-ai-server/audio";

const router: IRouter = Router();

const toneVoiceMap: Record<string, string> = {
  friendly: "nova",
  professional: "alloy",
  strict: "onyx",
  casual: "shimmer",
};

// TTS endpoint
router.post("/interview/tts", async (req, res): Promise<void> => {
  const parsed = TextToSpeechBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { text, voice, interviewerTone } = parsed.data;
  const selectedVoice = voice ?? (interviewerTone ? toneVoiceMap[interviewerTone] : "alloy") ?? "alloy";

  try {
    const audioBuffer = await textToSpeech(text, selectedVoice as any);
    const audio = audioBuffer.toString("base64");
    res.json({ audio });
  } catch (err) {
    res.status(500).json({ error: "TTS failed" });
  }
});

// Generate coding questions
router.post("/interview/generate-coding-questions", async (req, res): Promise<void> => {
  const parsed = GenerateCodingQuestionsBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { sessionId, skills, difficulty, language, count } = parsed.data;

  const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.id, sessionId));
  if (!session) { res.status(404).json({ error: "Session not found" }); return; }

  // Check if coding questions already generated
  const existing = await db.select().from(codingQuestionsTable).where(eq(codingQuestionsTable.sessionId, sessionId));
  if (existing.length > 0) { res.json(existing); return; }

  const [interview] = await db.select().from(interviewsTable).where(eq(interviewsTable.id, session.interviewId));
  const [jobProfile] = await db.select().from(jobProfilesTable).where(eq(jobProfilesTable.id, interview.jobProfileId));
  const jobSkills = await db.select().from(jobProfileSkillsTable).where(eq(jobProfileSkillsTable.jobProfileId, interview.jobProfileId));

  const skillNames = skills?.length ? skills.join(", ") : jobSkills.map((s) => s.skillName).join(", ");
  const actualCount = Math.min(count, interview.numCodingQuestions, 5);

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5.4",
      max_completion_tokens: 2048,
      messages: [
        {
          role: "system",
          content: `Generate exactly ${actualCount} coding problems for a ${jobProfile.title} interview.
Skills to test: ${skillNames}.
Language: ${language}.
Difficulty: ${difficulty ?? session.difficulty}.
Return a JSON array: [{"problem": "...", "exampleInput": "...", "exampleOutput": "...", "difficulty": "easy|medium|hard"}]
Only return valid JSON.`,
        },
        { role: "user", content: `Generate ${actualCount} coding interview questions.` },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "[]";
    const questions = JSON.parse(raw.replace(/```json\n?/g, "").replace(/```\n?/g, ""));

    const inserted = await db.insert(codingQuestionsTable).values(
      questions.slice(0, actualCount).map((q: any, i: number) => ({
        sessionId,
        language,
        problem: q.problem ?? "Solve the given problem",
        difficulty: (q.difficulty ?? difficulty ?? session.difficulty) as any,
        orderIndex: i,
        exampleInput: q.exampleInput ?? null,
        exampleOutput: q.exampleOutput ?? null,
      }))
    ).returning();

    res.json(inserted);
  } catch (err) {
    res.status(500).json({ error: "Failed to generate coding questions" });
  }
});

export default router;
