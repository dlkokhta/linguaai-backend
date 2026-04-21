import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { InternalServerErrorException } from '@nestjs/common';
import { GenerateService, QuizQuestion } from './generate.service';

const VALID_QUESTION: QuizQuestion = {
  display: 'She ___ ___ English right now.',
  options: ['is', 'was', 'studying', 'studied', 'are'],
  answers: ['is', 'studying'],
  full: 'She is studying English right now.',
};

const mockGroqOk = (questions: QuizQuestion[]) => ({
  ok: true,
  text: jest.fn().mockResolvedValue(
    JSON.stringify({ choices: [{ message: { content: JSON.stringify(questions) } }] }),
  ),
});

const mockGroqError = () => ({
  ok: false,
  text: jest.fn().mockResolvedValue('Unauthorized'),
});

describe('GenerateService', () => {
  let service: GenerateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenerateService,
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('test-key') } },
      ],
    }).compile();

    service = module.get<GenerateService>(GenerateService);
  });

  afterEach(() => jest.resetAllMocks());

  // ─── validateQuestion ────────────────────────────────────────────────────────

  describe('validateQuestion', () => {
    it('accepts a structurally valid question', () => {
      expect((service as any).validateQuestion(VALID_QUESTION)).toBe(true);
    });

    it('rejects when display has no blanks', () => {
      expect((service as any).validateQuestion({ ...VALID_QUESTION, display: 'She is studying English.' })).toBe(false);
    });

    it('rejects when blank count does not match answer count', () => {
      expect((service as any).validateQuestion({ ...VALID_QUESTION, display: 'She ___ English.' })).toBe(false);
    });

    it('rejects when an option contains a space (multi-word)', () => {
      const q = { ...VALID_QUESTION, options: ['is studying', 'was', 'studied', 'are', 'study'] };
      expect((service as any).validateQuestion(q)).toBe(false);
    });

    it('rejects when there are not enough options', () => {
      const q = { ...VALID_QUESTION, options: ['is', 'studying', 'was'] }; // needs answers.length + 2 = 4
      expect((service as any).validateQuestion(q)).toBe(false);
    });

    it('rejects when an answer is missing from options', () => {
      const q = { ...VALID_QUESTION, options: ['is', 'was', 'reading', 'studied', 'are'] };
      expect((service as any).validateQuestion(q)).toBe(false);
    });

    it('accepts answers matched case-insensitively', () => {
      const q = { ...VALID_QUESTION, options: ['Is', 'was', 'Studying', 'studied', 'are'] };
      expect((service as any).validateQuestion(q)).toBe(true);
    });

    it('rejects when display is empty', () => {
      expect((service as any).validateQuestion({ ...VALID_QUESTION, display: '' })).toBe(false);
    });

    it('rejects when options is not an array', () => {
      expect((service as any).validateQuestion({ ...VALID_QUESTION, options: null })).toBe(false);
    });

    it('rejects when answers is not an array', () => {
      expect((service as any).validateQuestion({ ...VALID_QUESTION, answers: null })).toBe(false);
    });

    it('accepts a single-blank question', () => {
      const q: QuizQuestion = {
        display: 'He ___ coffee every morning.',
        options: ['drinks', 'drinking', 'drank', 'is', 'drink'],
        answers: ['drinks'],
        full: 'He drinks coffee every morning.',
      };
      expect((service as any).validateQuestion(q)).toBe(true);
    });
  });

  // ─── buildQuizSystemMessage ──────────────────────────────────────────────────

  describe('buildQuizSystemMessage', () => {
    it('includes the tense formula', () => {
      const msg = (service as any).buildQuizSystemMessage('Present Continuous', 'Subject + am/is/are + V-ing');
      expect(msg).toContain('Subject + am/is/are + V-ing');
    });

    it('contains strict enforcement language', () => {
      const msg = (service as any).buildQuizSystemMessage('Present Simple', 'Subject + V1');
      expect(msg).toContain('NEVER');
    });
  });

  // ─── buildQuizPrompt ─────────────────────────────────────────────────────────

  describe('buildQuizPrompt', () => {
    it('includes tense name, formula, whenToUse and level', () => {
      const prompt = (service as any).buildQuizPrompt(
        'Present Continuous',
        'Subject + am/is/are + V-ing',
        'Use for actions happening right now.',
        'basic',
      );
      expect(prompt).toContain('Present Continuous');
      expect(prompt).toContain('Subject + am/is/are + V-ing');
      expect(prompt).toContain('Use for actions happening right now.');
      expect(prompt).toContain('basic');
    });

    it('instructs the model to self-verify each sentence', () => {
      const prompt = (service as any).buildQuizPrompt('Past Simple', 'Subject + V2', 'Completed actions.', 'intermediate');
      expect(prompt).toContain('verify');
    });
  });

  // ─── generateQuiz ────────────────────────────────────────────────────────────

  describe('generateQuiz', () => {
    const run = (overrides?: Partial<Parameters<typeof service.generateQuiz>[0]>) =>
      service.generateQuiz(
        'Present Continuous',
        'Subject + am/is/are + V-ing',
        'Use for actions happening right now.',
        'basic',
      );

    it('returns 10 valid questions on a clean first batch', async () => {
      global.fetch = jest.fn().mockResolvedValue(mockGroqOk(Array(10).fill(VALID_QUESTION)));
      const result = await run();
      expect(result).toHaveLength(10);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('filters out structurally invalid questions', async () => {
      const invalid = { ...VALID_QUESTION, display: 'She is studying English.' };
      global.fetch = jest.fn().mockResolvedValue(mockGroqOk([invalid, ...Array(9).fill(VALID_QUESTION)]));
      const result = await run();
      expect(result.every((q) => (q.display.match(/___/g) || []).length > 0)).toBe(true);
    });

    it('retries when first batch has fewer than 10 valid questions', async () => {
      global.fetch = jest.fn()
        .mockResolvedValueOnce(mockGroqOk(Array(5).fill(VALID_QUESTION)))
        .mockResolvedValueOnce(mockGroqOk(Array(5).fill(VALID_QUESTION)));
      const result = await run();
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(10);
    });

    it('returns up to 10 questions when combined batches exceed 10', async () => {
      global.fetch = jest.fn()
        .mockResolvedValueOnce(mockGroqOk(Array(7).fill(VALID_QUESTION)))
        .mockResolvedValueOnce(mockGroqOk(Array(7).fill(VALID_QUESTION)));
      const result = await run();
      expect(result).toHaveLength(10);
    });

    it('throws InternalServerErrorException when no valid questions after retry', async () => {
      const invalid = { ...VALID_QUESTION, display: 'She is studying.' };
      global.fetch = jest.fn().mockResolvedValue(mockGroqOk([invalid]));
      await expect(run()).rejects.toThrow(InternalServerErrorException);
    });

    it('throws when Groq returns a non-ok response', async () => {
      global.fetch = jest.fn().mockResolvedValue(mockGroqError());
      await expect(run()).rejects.toThrow(InternalServerErrorException);
    });

    it('throws when fetch itself fails (network error)', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
      await expect(run()).rejects.toThrow(InternalServerErrorException);
    });

    it('uses temperature 0.3 in the Groq request', async () => {
      global.fetch = jest.fn().mockResolvedValue(mockGroqOk(Array(10).fill(VALID_QUESTION)));
      await run();
      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.temperature).toBe(0.3);
    });

    it('sends a system role message before the user prompt', async () => {
      global.fetch = jest.fn().mockResolvedValue(mockGroqOk(Array(10).fill(VALID_QUESTION)));
      await run();
      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.messages[0].role).toBe('system');
      expect(body.messages[1].role).toBe('user');
    });

    it('system message contains the tense formula', async () => {
      global.fetch = jest.fn().mockResolvedValue(mockGroqOk(Array(10).fill(VALID_QUESTION)));
      await run();
      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.messages[0].content).toContain('am/is/are + V-ing');
    });
  });
});
