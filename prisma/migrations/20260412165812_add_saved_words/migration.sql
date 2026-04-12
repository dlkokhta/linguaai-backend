-- CreateTable
CREATE TABLE "saved_words" (
    "id" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "translation" TEXT NOT NULL,
    "examples" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "saved_words_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "saved_words" ADD CONSTRAINT "saved_words_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
