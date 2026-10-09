/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import Link from "next/link";
import { notificationTemplateRepository } from "../../../../../repositories/notification-template.repository";
import { connectDB } from "../../../../../config/db";
import NotificationTemplateBuilder from "../../../../../components/NotificationTemplateBuilder";

export const revalidate = 0;

export default async function TemplateLibraryPage() {
  await connectDB();

  const rawTemplates = await notificationTemplateRepository.findMany({});
  const templates = JSON.parse(JSON.stringify(rawTemplates));

  return (
    <div className="flex flex-col gap-10">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Notification Templates</h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure system subject/body layouts and dynamic variables per delivery channels.
          </p>
        </div>
        <Link
          href="/admin/notifications"
          className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg text-sm transition font-semibold"
        >
          ← Dashboard Home
        </Link>
      </div>

      <NotificationTemplateBuilder initialTemplates={templates} />
    </div>
  );
}
