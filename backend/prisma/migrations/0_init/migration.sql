-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'STUDENT',
    "username" TEXT,
    "password" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "department" TEXT,
    "verification_status" TEXT NOT NULL DEFAULT 'PENDING',
    "profile_data" TEXT,
    "google_refresh_token" TEXT,
    "company" TEXT,
    "batch_year" INTEGER,
    "college_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interview_requests" (
    "request_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "alumni_id" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "scheduled_time" TIMESTAMP(3),
    "room_id" TEXT,
    "student_profile_snapshot" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interview_requests_pkey" PRIMARY KEY ("request_id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "notification_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "request_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("notification_id")
);

-- CreateTable
CREATE TABLE "schedule_slots" (
    "slot_id" TEXT NOT NULL,
    "alumni_id" TEXT NOT NULL,
    "student_id" TEXT,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedule_slots_pkey" PRIMARY KEY ("slot_id")
);

-- CreateTable
CREATE TABLE "interview_records" (
    "interview_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "alumni_id" TEXT NOT NULL,
    "transcript" TEXT,
    "student_score" DOUBLE PRECISION,
    "alumni_feedback" TEXT,
    "ai_action_items" TEXT,
    "request_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interview_records_pkey" PRIMARY KEY ("interview_id")
);

-- CreateTable
CREATE TABLE "session_feedbacks" (
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

    CONSTRAINT "session_feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "desc" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_configs" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "college_registry" (
    "college_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "department" TEXT NOT NULL,

    CONSTRAINT "college_registry_pkey" PRIMARY KEY ("college_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "interview_requests_student_id_idx" ON "interview_requests"("student_id");

-- CreateIndex
CREATE INDEX "interview_requests_alumni_id_idx" ON "interview_requests"("alumni_id");

-- CreateIndex
CREATE INDEX "interview_requests_status_idx" ON "interview_requests"("status");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_read_idx" ON "notifications"("user_id", "read");

-- CreateIndex
CREATE UNIQUE INDEX "interview_records_request_id_key" ON "interview_records"("request_id");

-- CreateIndex
CREATE INDEX "interview_records_student_id_idx" ON "interview_records"("student_id");

-- CreateIndex
CREATE INDEX "interview_records_alumni_id_idx" ON "interview_records"("alumni_id");

-- CreateIndex
CREATE UNIQUE INDEX "session_feedbacks_room_id_key" ON "session_feedbacks"("room_id");

-- CreateIndex
CREATE UNIQUE INDEX "platform_configs_key_key" ON "platform_configs"("key");

-- AddForeignKey
ALTER TABLE "interview_requests" ADD CONSTRAINT "interview_requests_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_requests" ADD CONSTRAINT "interview_requests_alumni_id_fkey" FOREIGN KEY ("alumni_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_slots" ADD CONSTRAINT "schedule_slots_alumni_id_fkey" FOREIGN KEY ("alumni_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_slots" ADD CONSTRAINT "schedule_slots_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_records" ADD CONSTRAINT "interview_records_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_records" ADD CONSTRAINT "interview_records_alumni_id_fkey" FOREIGN KEY ("alumni_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_feedbacks" ADD CONSTRAINT "session_feedbacks_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_feedbacks" ADD CONSTRAINT "session_feedbacks_alumni_id_fkey" FOREIGN KEY ("alumni_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
