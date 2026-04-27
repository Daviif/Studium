-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "readAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "NotificationPreference" ADD COLUMN     "inAppNotifications" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "notifiedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "pushSubscription" TEXT;

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_taskId_idx" ON "Notification"("taskId");
