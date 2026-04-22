import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface TensePracticeQuestion {
  tense: string;
  label: string;
  ka: string;
  en: string;
  hints: string[];
  options: string[];
}

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

  private buildQuizSystemMessage(tense: string, formula: string): string {
    return `You are a strict English grammar quiz generator. Your only job is to produce fill-in-the-blank sentences in the exact tense requested. You NEVER use any other tense. You NEVER mix tenses. Every sentence you produce must follow the given formula precisely: ${formula}. If a sentence does not follow this formula, do not include it.`;
  }

  private buildQuizPrompt(tense: string, formula: string, whenToUse: string, level: string): string {
    return `Generate exactly 10 fill-in-the-blank quiz sentences strictly in the "${tense}" tense at "${level}" difficulty.

TENSE DEFINITION:
- Name: ${tense}
- Formula: ${formula}
- When to use: ${whenToUse}

RULES:
1. EVERY sentence MUST follow this exact formula: ${formula}. No exceptions.
2. Use time markers that belong to ${tense} (e.g. "every day/always/usually" → Present Simple, "right now/at the moment" → Present Continuous, "yesterday/last week" → Past Simple, "already/just/ever/never" → Present Perfect).
3. Replace ONLY the verb word(s) that form the "${tense}" tense with "___" — one ___ per word.
4. Every option must be a SINGLE word with no spaces.
5. Provide 5-6 options: correct answer words (each a separate single word) + 3-4 single-word distractors, all shuffled.
6. Before finalising each sentence, mentally verify: does the full sentence use the ${tense} formula exactly? If not, replace it with one that does.

Return ONLY a valid JSON array of exactly 10 objects, no markdown, no explanation:
[{"display":"sentence with ___ blanks","options":["word1","word2",...],"answers":["ans1","ans2"],"full":"complete correct sentence"}]

Example for Present Continuous (Subject + am/is/are + V-ing):
[{"display":"She ___ ___ English right now.","options":["is","was","studying","studied","are","study"],"answers":["is","studying"],"full":"She is studying English right now."}]

Example for Present Simple (Subject + V1, s/es for he/she/it):
[{"display":"He ___ coffee every morning.","options":["drinks","drinking","drank","is","drink","drunk"],"answers":["drinks"],"full":"He drinks coffee every morning."}]`;
  }

  private validateQuestion(q: QuizQuestion): boolean {
    if (!q.display || !q.full || !Array.isArray(q.options) || !Array.isArray(q.answers)) return false;
    const blankCount = (q.display.match(/___/g) || []).length;
    if (blankCount === 0 || blankCount !== q.answers.length) return false;
    if (q.options.some((o) => o.trim().includes(' '))) return false;
    if (q.options.length < q.answers.length + 2) return false;
    return q.answers.every((ans) =>
      q.options.some((opt) => opt.toLowerCase() === ans.toLowerCase()),
    );
  }

  private async callGroqForQuiz(systemMessage: string, prompt: string): Promise<QuizQuestion[]> {
    const apiKey = this.config.get<string>('GROQ_API_KEY');
    const url = 'https://api.groq.com/openai/v1/chat/completions';

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemMessage },
            { role: 'user', content: prompt },
          ],
          temperature: 0.3,
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
    if (!match) return [];

    try {
      const questions = JSON.parse(match[0]);
      return Array.isArray(questions) ? questions : [];
    } catch {
      return [];
    }
  }

  async generateQuiz(tense: string, formula: string, whenToUse: string, level: string): Promise<QuizQuestion[]> {
    const systemMessage = this.buildQuizSystemMessage(tense, formula);
    const prompt = this.buildQuizPrompt(tense, formula, whenToUse, level);

    const firstBatch = await this.callGroqForQuiz(systemMessage, prompt);
    let valid = firstBatch.filter((q) => this.validateQuestion(q));

    if (valid.length < 10) {
      console.warn(`[GenerateService] Only ${valid.length} valid quiz questions, retrying…`);
      const secondBatch = await this.callGroqForQuiz(systemMessage, prompt);
      const secondValid = secondBatch.filter((q) => this.validateQuestion(q));
      valid = [...valid, ...secondValid];
    }

    if (valid.length === 0) {
      throw new InternalServerErrorException('Failed to generate valid quiz questions');
    }

    return valid.slice(0, 10);
  }

  async generateTensePractice(tenses: string[], topic: string): Promise<TensePracticeQuestion[]> {
    const apiKey = this.config.get<string>('GROQ_API_KEY');
    const url = 'https://api.groq.com/openai/v1/chat/completions';

    const systemMessage = `You are an English language practice generator for Georgian speakers. Generate exactly one sentence per requested tense. Every sentence MUST strictly use its specified tense — never mix tenses. Georgian sentences must sound natural and use simple everyday language, not literal translations.`;

    const prompt = `Generate one practice sentence for each of these tenses: ${tenses.join(', ')}.
Topic: ${topic || 'general daily life'}.

For each tense return:
- "tense": the tense name (e.g., "Present Simple")
- "label": tense name + use case in parentheses (e.g., "Present Simple (Habit)")
- "ka": natural Georgian sentence (everyday Georgian, not a literal translation)
- "en": correct English sentence strictly in the specified tense
- "hints": array of 3-4 key words from the English sentence
- "options": array containing EVERY individual word from the English sentence (each word separate, split by spaces) PLUS 3-4 single-word distractors that do NOT belong, all shuffled randomly

Rules:
1. The English sentence MUST use exactly the tense specified — no exceptions.
2. Every entry in "options" must be a single word (no spaces inside a word).
3. "options" must contain all words needed to assemble the complete "en" sentence plus 3-4 extra distractor words.

Return ONLY a valid JSON array of exactly ${tenses.length} objects, no markdown, no explanation:
[{"tense":"Present Simple","label":"Present Simple (Habit)","ka":"მე ყოველდღე ვიყენებ ლეპტოპს სამუშაოდ.","en":"I use my laptop every day.","hints":["use","every","day"],"options":["use","my","I","laptop","day","every","going","was","studied","never"]}]`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemMessage },
            { role: 'user', content: prompt },
          ],
          temperature: 0.4,
          max_tokens: 2048,
        }),
      });
    } catch (err) {
      console.error('[GenerateService] tense practice fetch error:', err);
      throw new InternalServerErrorException('Failed to reach Groq API');
    }

    const raw = await response.text();
    if (!response.ok) {
      console.error('[GenerateService] Groq tense practice error:', raw);
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
      console.error('[GenerateService] No JSON array in tense practice response:', text);
      throw new InternalServerErrorException('Failed to extract practice questions from response');
    }

    try {
      const questions = JSON.parse(match[0]) as TensePracticeQuestion[];
      if (!Array.isArray(questions) || questions.length === 0) throw new Error('Empty');
      return questions;
    } catch {
      throw new InternalServerErrorException('Failed to parse practice questions');
    }
  }
}

