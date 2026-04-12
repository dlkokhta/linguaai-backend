-- CreateTable
CREATE TABLE "saved_sentences" (
    "id" TEXT NOT NULL,
    "en" TEXT NOT NULL,
    "ka" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "saved_sentences_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "saved_sentences" ADD CONSTRAINT "saved_sentences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
