-- CreateTable
CREATE TABLE "SessionFeedback" (
    "id" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "topic" TEXT,
    "meet_link" TEXT,
    "student_id" TEXT NOT NULL,
    "alumni_id" TEXT NOT NULL,
    "student_name" TEXT,
    "alumni_name" TEXT,
    "student_rating" INTEGER,
    "student_feedback" TEXT,
    "alumni_rating" INTEGER,
    "alumni_feedback" TEXT,
    "duration_minutes" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SessionFeedback_room_id_key" ON "SessionFeedback"("room_id");

-- AddForeignKey
ALTER TABLE "SessionFeedback" ADD CONSTRAINT "SessionFeedback_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionFeedback" ADD CONSTRAINT "SessionFeedback_alumni_id_fkey" FOREIGN KEY ("alumni_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
