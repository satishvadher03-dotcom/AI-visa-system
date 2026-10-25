import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db.ts';
import { generateVisaAssistantResponse, ChatMessageInput } from '../services/ai.ts';

export const aiRouter = Router();

const ChatRequestSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
  language: z.enum(['en', 'gu', 'hi']).default('en'),
  sessionToken: z.string().optional(),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'model']),
        content: z.string(),
      })
    )
    .optional(),
});

// POST /api/v1/ai/chat
aiRouter.post('/chat', async (req: Request, res: Response) => {
  try {
    const parse = ChatRequestSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        success: false,
        error: parse.error.issues[0]?.message || 'Invalid chat parameters',
      });
    }

    const { message, language, sessionToken, history } = parse.data;

    // Get or create ChatSession in DB
    let currentSessionToken = sessionToken;
    let chatSessionId: string | undefined;

    if (currentSessionToken) {
      const existingSession = await prisma.chatSession.findUnique({
        where: { sessionToken: currentSessionToken },
      });
      if (existingSession) {
        chatSessionId = existingSession.id;
      }
    }

    if (!chatSessionId) {
      currentSessionToken = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const newSession = await prisma.chatSession.create({
        data: {
          sessionToken: currentSessionToken,
          userId: req.user?.id || null,
          language,
        },
      });
      chatSessionId = newSession.id;
    }

    // Record user message in DB
    await prisma.chatMessage.create({
      data: {
        chatSessionId,
        role: 'user',
        content: message,
      },
    });

    // Generate AI response
    const aiResult = await generateVisaAssistantResponse({
      message,
      history: history as ChatMessageInput[],
      language,
    });

    // Record model message in DB
    await prisma.chatMessage.create({
      data: {
        chatSessionId,
        role: 'model',
        content: aiResult.reply,
        sourcesJson: JSON.stringify(aiResult.sources),
      },
    });

    return res.json({
      success: true,
      sessionToken: currentSessionToken,
      reply: aiResult.reply,
      sources: aiResult.sources,
      disclaimer: aiResult.disclaimer,
      language: aiResult.language,
    });
  } catch (err) {
    console.error('AI chat endpoint error:', err);
    return res.status(500).json({
      success: false,
      error: 'The AI Visa Assistant encountered an issue. Please try again or consult official sources directly.',
      sources: [
        {
          country: 'India',
          visaType: 'e-Visa',
          name: 'Official Indian e-Visa Portal',
          url: 'https://indianvisaonline.gov.in/evisa/',
          verifiedDate: new Date().toISOString().split('T')[0],
        },
      ],
      disclaimer:
        'AuraVisa Global provides consular facilitation. Official issuance decisions remain with sovereign immigration authorities.',
    });
  }
});
