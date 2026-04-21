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

  async generateQuiz(tense: string, formula: string, whenToUse: string, level: string): Promise<QuizQuestion[]> {
    const apiKey = this.config.get<string>('GROQ_API_KEY');
    const url = 'https://api.groq.com/openai/v1/chat/completions';

    const prompt = `You are a strict English grammar quiz generator. Generate exactly 10 fill-in-the-blank sentences for the "${tense}" tense at "${level}" difficulty.

TENSE DEFINITION:
- Name: ${tense}
- Formula: ${formula}
- When to use: ${whenToUse}

CRITICAL RULES — read carefully:
1. EVERY sentence must strictly follow the formula: ${formula}. No other tense is allowed.
2. Use time markers/context words that naturally belong to the ${tense} tense (e.g. "every day" for Present Simple, "right now/at the moment" for Present Continuous, "yesterday/last week" for Past Simple, "already/just/ever" for Present Perfect, etc.)
3. Replace ONLY the verb word(s) that form the "${tense}" tense with "___" — one ___ per individual word
4. Every option must be a SINGLE word with no spaces — never combine two words as one option
5. Provide 5-6 options: correct answer words (each as a separate single word) + 3-4 single-word distractors, all shuffled
6. Distractors should be from other tenses of the same verb or auxiliary verbs that do NOT match the formula

Return ONLY a valid JSON array of exactly 10 objects, no markdown, no explanation:
[{"display":"sentence with ___ blanks","options":["word1","word2",...],"answers":["ans1","ans2"],"full":"complete correct sentence"}]

Example for Present Continuous (formula: Subject + am/is/are + V-ing):
[{"display":"She ___ ___ English right now.","options":["is","was","studying","studied","are","study"],"answers":["is","studying"],"full":"She is studying English right now."}]

Example for Present Simple (formula: Subject + V1, s/es for he/she/it):
[{"display":"He ___ coffee every morning.","options":["drinks","drinking","drank","is","drink","drunk"],"answers":["drinks"],"full":"He drinks coffee every morning."}]`;

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

