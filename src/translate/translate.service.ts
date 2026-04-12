import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface WordTranslation {
  word: string;
  translation: string;
  examples: { en: string; ka: string }[];
}

@Injectable()
export class TranslateService {
  constructor(private readonly config: ConfigService) {}

  async translateWord(word: string): Promise<WordTranslation> {
    const apiKey = this.config.get<string>('GROQ_API_KEY');
    const url = 'https://api.groq.com/openai/v1/chat/completions';

    const prompt = `Translate the English word "${word}" to Georgian (ქართული) and provide 3 example sentences.
Use natural, everyday conversational Georgian - prefer simple and commonly used words.
Return ONLY a valid JSON object with this exact shape, no markdown, no code fences, no explanation:
{"word":"${word}","translation":"georgian word here","examples":[{"en":"example sentence","ka":"georgian translation"},{"en":"example sentence","ka":"georgian translation"},{"en":"example sentence","ka":"georgian translation"}]}`;

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
          temperature: 0.5,
          max_tokens: 1024,
        }),
      });
    } catch (err) {
      console.error('[TranslateService] fetch error:', err);
      throw new InternalServerErrorException('Failed to reach Groq API');
    }

    const raw = await response.text();

    if (!response.ok) {
      console.error('[TranslateService] Groq error response:', raw);
      throw new InternalServerErrorException('Groq API returned an error');
    }

    let data: any;
    try {
      data = JSON.parse(raw);
    } catch {
      throw new InternalServerErrorException('Failed to parse Groq response');
    }

    const text: string = data?.choices?.[0]?.message?.content ?? '';

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      console.error('[TranslateService] No JSON object found in:', text);
      throw new InternalServerErrorException('Failed to extract translation from response');
    }

    try {
      const result = JSON.parse(match[0]) as WordTranslation;
      if (!result.translation || !Array.isArray(result.examples)) throw new Error('Invalid shape');
      return result;
    } catch {
      console.error('[TranslateService] Parse error:', match[0]);
      throw new InternalServerErrorException('Failed to parse translation result');
    }
  }
}
