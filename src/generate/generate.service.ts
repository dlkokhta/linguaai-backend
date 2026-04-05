import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GenerateService {
  constructor(private readonly config: ConfigService) {}

  async generateSentences(topic: string, difficulty: string): Promise<{ en: string; ka: string }[]> {
    const apiKey = this.config.get<string>('GROQ_API_KEY');
    const url = 'https://api.groq.com/openai/v1/chat/completions';

    const prompt = `Generate exactly 10 English sentences about the topic "${topic}" at ${difficulty} difficulty level for language learners. For each sentence, also provide its Georgian (ქართული) translation. Return ONLY a valid JSON array of 10 objects with "en" and "ka" keys, no markdown, no code fences, no explanation. Example: [{"en": "I love traveling.", "ka": "მიყვარს მოგზაურობა."}]`;

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
}

