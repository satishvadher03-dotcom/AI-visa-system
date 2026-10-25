import { GoogleGenAI } from '@google/genai';
import { prisma } from '../db.ts';

const apiKey = process.env.GEMINI_API_KEY;

let aiClient: GoogleGenAI | null = null;
if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  aiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export interface ChatMessageInput {
  role: 'user' | 'model';
  content: string;
}

export interface AiChatResponse {
  reply: string;
  sources: Array<{
    country: string;
    visaType: string;
    name: string;
    url: string;
    verifiedDate: string;
  }>;
  disclaimer: string;
  language: string;
}

const GENERAL_DISCLAIMER =
  'Important Notice: AuraVisa Global is a private visa consultancy and document facilitation agency. We do not issue visas or guarantee entry. Final issuance decisions rest solely with the sovereign immigration authorities of the destination country. Always cross-verify with official portals.';

export async function generateVisaAssistantResponse(params: {
  message: string;
  history?: ChatMessageInput[];
  language?: string; // 'en' | 'gu' | 'hi'
  countryContext?: string;
}): Promise<AiChatResponse> {
  const language = params.language || 'en';

  // Retrieve official verified visa programs from our SQLite database to ground the AI
  const visaPrograms = await prisma.visaProgram.findMany({
    where: { isActive: true },
    include: {
      officialSources: true,
      documentRequirements: true,
    },
    take: 12,
  });

  // Extract relevant sources
  const verifiedSourcesList: Array<{
    country: string;
    visaType: string;
    name: string;
    url: string;
    verifiedDate: string;
  }> = [];

  const programsKnowledge = visaPrograms.map((p) => {
    p.officialSources.forEach((s) => {
      verifiedSourcesList.push({
        country: p.countryName,
        visaType: p.visaType,
        name: s.name,
        url: s.officialUrl,
        verifiedDate: p.lastVerifiedAt.toISOString().split('T')[0],
      });
    });

    const reqs = p.documentRequirements.map((r) => `${r.name} (${r.isMandatory ? 'Mandatory' : 'Optional'})`).join(', ');

    return `Destination: ${p.countryName} (${p.countryCode}) | Visa: ${p.visaType} | Category: ${p.category} | Validity: ${p.validity} | Entry: ${p.entryType} | Official Govt Fee: $${p.officialFeeUSD} USD | Est. Processing: ${p.processingTimeDays} business days | Official Source: ${p.officialSourceName} (${p.officialSourceUrl}) | Requirements: ${reqs}`;
  }).join('\n\n');

  // Filter sources that might match the user's message query
  const userTextLower = params.message.toLowerCase();
  const matchedSources = verifiedSourcesList.filter((s) => {
    return (
      userTextLower.includes(s.country.toLowerCase()) ||
      userTextLower.includes(s.visaType.toLowerCase()) ||
      userTextLower.includes('visa') ||
      userTextLower.includes('tourist') ||
      userTextLower.includes('business')
    );
  }).slice(0, 4);

  const finalSources = matchedSources.length > 0 ? matchedSources : verifiedSourcesList.slice(0, 3);

  // If Gemini API is available, invoke it
  if (aiClient) {
    try {
      const languageInstruction =
        language === 'gu'
          ? 'Respond entirely in natural, polite Gujarati (ગુજરાતી).'
          : language === 'hi'
          ? 'Respond entirely in professional, polite Hindi (हिन्दी).'
          : 'Respond in professional, clear, empathetic English.';

      const systemInstruction = `You are "Aura", the certified Senior AI Visa Consultant at AuraVisa Global.
Your mission is to provide accurate, transparent, and legally sound guidance on electronic visas (eVisa), document requirements, application preparation, and international travel flows (both India-to-World and World-to-India).

Language Requirement: ${languageInstruction}

Strict Rules:
1. ONLY use verified facts from the grounded knowledge base below or established official embassy guidelines.
2. NEVER guarantee visa approval or issuance under any circumstances.
3. NEVER fabricate fees, processing timelines, or government URLs.
4. When mentioning visa requirements or fees, cite the official government portal name and URL.
5. If you are uncertain or the user asks about an unsupported country or irregular passport situation, explicitly state that consular policies vary and recommend booking a consultation with our human visa specialists.
6. Always maintain a professional, calm, reassuring tone.
7. End or accompany your guidance with a brief note reminding the applicant that sovereign immigration authorities retain sole discretionary jurisdiction.

Verified Official Knowledge Base:
${programsKnowledge}`;

      const conversationHistory = (params.history || []).slice(-6).map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');

      const prompt = `${conversationHistory ? `Conversation so far:\n${conversationHistory}\n\n` : ''}User Question: ${params.message}\n\nPlease provide your expert consultation:`;

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI response timed out, using verified consular fallback')), 3500)
      );

      const response = await Promise.race([
        aiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction,
            temperature: 0.2, // Low temperature for high factual accuracy
          },
        }),
        timeoutPromise,
      ]);

      const replyText = response.text || 'I could not generate a response. Please check back shortly or speak with a consultant.';

      return {
        reply: replyText,
        sources: finalSources,
        disclaimer: GENERAL_DISCLAIMER,
        language,
      };
    } catch (err: any) {
      console.warn('Gemini API call warning:', err?.message || err);
      // Fallback gracefully below
    }
  }

  // Safe fallback if API key is missing or errored
  let fallbackReply = '';
  if (language === 'gu') {
    fallbackReply = `નમસ્તે! AuraVisa Global AI કન્સલ્ટન્ટમાં આપનું સ્વાગત છે. તમારા વિઝા માટે અમારા અધિકૃત સરકારી પોર્ટલ સ્ત્રોતો નીચે દર્શાવેલ છે. કૃપા કરીને પાસપોર્ટ બાયોડેટા પેજ (ન્યૂનતમ ૬ મહિનાની માન્યતા) અને યોગ્ય કદનો સફેદ બેકગ્રાઉન્ડ ફોટો તૈયાર રાખો. કોઈપણ વિશેષ કેસ માટે, કૃપા કરીને અમારા નિષ્ણાત કન્સલ્ટન્ટ સાથે પરામર્શ બુક કરો.`;
  } else if (language === 'hi') {
    fallbackReply = `नमस्ते! AuraVisa Global AI वीज़ा परामर्श में आपका स्वागत है। आपके वीज़ा मार्गदर्शन के लिए हमारे सत्यापित सरकारी पोर्टल लिंक नीचे दिए गए हैं। कृपया अपना पासपोर्ट (न्यूनतम 6 महीने की वैधता) और सफेद पृष्ठभूमि वाली फोटो तैयार रखें। विस्तृत फ़ाइल समीक्षा के लिए, कृपया हमारे वीज़ा सलाहकार के साथ परामर्श बुक करें।`;
  } else {
    fallbackReply = `Welcome to AuraVisa Global. We assist travelers with verified electronic visas, documentation verification, and embassy interview preparation. For your destination, ensure your passport has at least 6 months validity from the travel date and prepare clear color scans of your biodata page and a recent white-background photograph. Please explore our verified government portals below or schedule a consultation with our case officers.`;
  }

  return {
    reply: fallbackReply,
    sources: finalSources,
    disclaimer: GENERAL_DISCLAIMER,
    language,
  };
}
