import { Router, type IRouter } from "express";
import { db, conversations as conversationsTable, messages as messagesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateOpenaiConversationBody,
  SendOpenaiMessageBody,
  SendOpenaiVoiceMessageBody,
  GetOpenaiConversationParams,
  DeleteOpenaiConversationParams,
  ListOpenaiMessagesParams,
  SendOpenaiMessageParams,
  SendOpenaiVoiceMessageParams,
} from "@workspace/api-zod";
import { openai } from "@workspace/integrations-openai-ai-server";
import { voiceChatStream, ensureCompatibleFormat } from "@workspace/integrations-openai-ai-server/audio";

const router: IRouter = Router();

router.get("/openai/conversations", async (_req, res): Promise<void> => {
  const conversations = await db.select().from(conversationsTable);
  res.json(conversations);
});

router.post("/openai/conversations", async (req, res): Promise<void> => {
  const parsed = CreateOpenaiConversationBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [conversation] = await db.insert(conversationsTable).values({ title: parsed.data.title }).returning();
  res.status(201).json(conversation);
});

router.get("/openai/conversations/:id", async (req, res): Promise<void> => {
  const params = GetOpenaiConversationParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [conversation] = await db.select().from(conversationsTable).where(eq(conversationsTable.id, params.data.id));
  if (!conversation) { res.status(404).json({ error: "Not found" }); return; }

  const msgs = await db.select().from(messagesTable).where(eq(messagesTable.conversationId, params.data.id));
  res.json({ ...conversation, messages: msgs });
});

router.delete("/openai/conversations/:id", async (req, res): Promise<void> => {
  const params = DeleteOpenaiConversationParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [conversation] = await db.select().from(conversationsTable).where(eq(conversationsTable.id, params.data.id));
  if (!conversation) { res.status(404).json({ error: "Not found" }); return; }

  await db.delete(conversationsTable).where(eq(conversationsTable.id, params.data.id));
  res.sendStatus(204);
});

router.get("/openai/conversations/:id/messages", async (req, res): Promise<void> => {
  const params = ListOpenaiMessagesParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const msgs = await db.select().from(messagesTable).where(eq(messagesTable.conversationId, params.data.id));
  res.json(msgs);
});

router.post("/openai/conversations/:id/messages", async (req, res): Promise<void> => {
  const params = SendOpenaiMessageParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = SendOpenaiMessageBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [conversation] = await db.select().from(conversationsTable).where(eq(conversationsTable.id, params.data.id));
  if (!conversation) { res.status(404).json({ error: "Not found" }); return; }

  const history = await db.select().from(messagesTable).where(eq(messagesTable.conversationId, params.data.id));
  await db.insert(messagesTable).values({ conversationId: params.data.id, role: "user", content: parsed.data.content });

  const chatMessages: any[] = [
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: parsed.data.content },
  ];

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let fullResponse = "";
  const stream = await openai.chat.completions.create({
    model: "gpt-5.4",
    max_completion_tokens: 8192,
    messages: chatMessages,
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      fullResponse += content;
      res.write(`data: ${JSON.stringify({ content })}\n\n`);
    }
  }

  await db.insert(messagesTable).values({ conversationId: params.data.id, role: "assistant", content: fullResponse });
  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  res.end();
});

router.post("/openai/conversations/:id/voice-messages", async (req, res): Promise<void> => {
  const params = SendOpenaiVoiceMessageParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = SendOpenaiVoiceMessageBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const audioBuffer = Buffer.from(parsed.data.audio, "base64");
  const { buffer, format } = await ensureCompatibleFormat(audioBuffer);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const stream = await voiceChatStream(buffer, "alloy", format as any);
  let assistantTranscript = "";
  let userTranscript = "";

  for await (const event of stream) {
    if (event.type === "transcript") assistantTranscript += event.data;
    if (event.type === "user_transcript") userTranscript += event.data;
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  }

  await db.insert(messagesTable).values([
    { conversationId: params.data.id, role: "user", content: userTranscript },
    { conversationId: params.data.id, role: "assistant", content: assistantTranscript },
  ]);

  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  res.end();
});

export default router;
