-- CreateIndex
CREATE INDEX "InterviewRecord_student_id_idx" ON "InterviewRecord"("student_id");

-- CreateIndex
CREATE INDEX "InterviewRecord_alumni_id_idx" ON "InterviewRecord"("alumni_id");

-- CreateIndex
CREATE INDEX "InterviewRequest_student_id_idx" ON "InterviewRequest"("student_id");

-- CreateIndex
CREATE INDEX "InterviewRequest_alumni_id_idx" ON "InterviewRequest"("alumni_id");

-- CreateIndex
CREATE INDEX "InterviewRequest_status_idx" ON "InterviewRequest"("status");

-- CreateIndex
CREATE INDEX "Notification_user_id_idx" ON "Notification"("user_id");

-- CreateIndex
CREATE INDEX "Notification_user_id_read_idx" ON "Notification"("user_id", "read");
