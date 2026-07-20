-- AlterEnum
ALTER TYPE "CardType" ADD VALUE 'CUSTOM';

-- AlterTable
ALTER TABLE "flashcards" ADD COLUMN     "back" TEXT,
ADD COLUMN     "front" TEXT;
