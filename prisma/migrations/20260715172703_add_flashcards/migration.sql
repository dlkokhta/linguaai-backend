-- CreateEnum
CREATE TYPE "CardType" AS ENUM ('WORD', 'SENTENCE');

-- CreateTable
CREATE TABLE "flashcards" (
    "id" TEXT NOT NULL,
    "card_type" "CardType" NOT NULL,
    "ease_factor" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "interval_days" INTEGER NOT NULL DEFAULT 0,
    "repetitions" INTEGER NOT NULL DEFAULT 0,
    "due_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "saved_word_id" TEXT,
    "saved_sentence_id" TEXT,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flashcards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "flashcards_saved_word_id_key" ON "flashcards"("saved_word_id");

-- CreateIndex
CREATE UNIQUE INDEX "flashcards_saved_sentence_id_key" ON "flashcards"("saved_sentence_id");

-- CreateIndex
CREATE INDEX "flashcards_user_id_due_date_idx" ON "flashcards"("user_id", "due_date");

-- AddForeignKey
ALTER TABLE "flashcards" ADD CONSTRAINT "flashcards_saved_word_id_fkey" FOREIGN KEY ("saved_word_id") REFERENCES "saved_words"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flashcards" ADD CONSTRAINT "flashcards_saved_sentence_id_fkey" FOREIGN KEY ("saved_sentence_id") REFERENCES "saved_sentences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flashcards" ADD CONSTRAINT "flashcards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
