import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface QuizQuestion {
  display: string;
  options: string[];
  answers: string[];
  full: string;
}

@Injectable()
export class GenerateService {
  constructor(private readonly config: ConfigService) { }

  async generateSentences(topic: string, difficulty: string): Promise<{ en: string; ka: string }[]> {
    const apiKey = this.config.get<string>('GROQ_API_KEY');
    const url = 'https://api.groq.com/openai/v1/chat/completions';

    const prompt = `Generate exactly 10 English sentences about the topic "${topic}" at ${difficulty} difficulty level for language learners. For each sentence, also provide its Georgian (ქართული) translation. Use natural, everyday conversational Georgian language - prefer simple and commonly used Georgian words over rare or formal ones. Return ONLY a valid JSON array of 10 objects with "en" and "ka" keys, no markdown, no code fences, no explanation. Example: [{"en": "I love traveling.", "ka": "მიყვარს მოგზაურობა."}]`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 2048,
        }),
      });
    } catch (err) {
      console.error('[GenerateService] fetch error:', err);
      throw new InternalServerErrorException('Failed to reach Groq API');
    }

    const raw = await response.text();

    if (!response.ok) {
      console.error('[GenerateService] Groq error response:', raw);
      throw new InternalServerErrorException('Groq API returned an error');
    }

    let data: any;
    try {
      data = JSON.parse(raw);
    } catch {
      console.error('[GenerateService] JSON parse error, raw:', raw);
      throw new InternalServerErrorException('Failed to parse Groq response');
    }

    const text: string = data?.choices?.[0]?.message?.content ?? '';

    // extract JSON array from text
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) {
      console.error('[GenerateService] No JSON array found in:', text);
      throw new InternalServerErrorException('Failed to extract sentences from response');
    }

    try {
      const sentences = JSON.parse(match[0]) as { en: string; ka: string }[];
      if (!Array.isArray(sentences)) throw new Error('Not an array');
      return sentences;
    } catch {
      console.error('[GenerateService] Array parse error:', match[0]);
      throw new InternalServerErrorException('Failed to parse sentences array');
    }
  }

  async generateQuiz(tense: string, formula: string, level: string): Promise<QuizQuestion[]> {
    const apiKey = this.config.get<string>('GROQ_API_KEY');
    const url = 'https://api.groq.com/openai/v1/chat/completions';

    const prompt = `Generate exactly 10 fill-in-the-blank quiz sentences strictly using the "${tense}" tense at "${level}" difficulty level for English learners.

Tense formula: ${formula}
Every single sentence MUST follow this exact formula. Do NOT use any other tense.

Rules:
- Replace only the verb word(s) that form the "${tense}" tense with "___" — one ___ per individual word
- Each option MUST be a single word with no spaces. Never combine two words into one option.
- Provide 5-6 options: the correct answer words (each as a separate single word) plus 3-4 single-word distractors, all shuffled
- Keep sentences natural and appropriate for ${level} level

Return ONLY a valid JSON array of exactly 10 objects, no markdown, no explanation:
[{"display":"sentence with ___ blanks","options":["word1","word2",...],"answers":["ans1","ans2"],"full":"complete correct sentence"}]

Example for Present Continuous (formula: Subject + am/is/are + V-ing) — every option is ONE word:
[{"display":"She ___ ___ English right now.","options":["is","was","studying","studied","are","study"],"answers":["is","studying"],"full":"She is studying English right now."}]`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 3000,
        }),
      });
    } catch (err) {
      console.error('[GenerateService] quiz fetch error:', err);
      throw new InternalServerErrorException('Failed to reach Groq API');
    }

    const raw = await response.text();
    if (!response.ok) {
      console.error('[GenerateService] Groq quiz error:', raw);
      throw new InternalServerErrorException('Groq API returned an error');
    }

    let data: any;
    try {
      data = JSON.parse(raw);
    } catch {
      throw new InternalServerErrorException('Failed to parse Groq response');
    }

    const text: string = data?.choices?.[0]?.message?.content ?? '';
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) {
      console.error('[GenerateService] No quiz JSON found in:', text);
      throw new InternalServerErrorException('Failed to extract quiz from response');
    }

    try {
      const questions = JSON.parse(match[0]) as QuizQuestion[];
      if (!Array.isArray(questions)) throw new Error('Not an array');
      return questions;
    } catch {
      console.error('[GenerateService] Quiz array parse error:', match[0]);
      throw new InternalServerErrorException('Failed to parse quiz array');
    }
  }
}

