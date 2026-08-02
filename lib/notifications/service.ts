import { prisma } from "@/lib/prisma";
import { emailProvider, whatsappProvider } from "./channel-providers";
import type { NotificationChannel } from "@/lib/enums";

interface NotifyInput {
  userId: string;
  type: string;
  title: string;
  body: string;
  channels?: NotificationChannel[];
  meta?: Record<string, unknown>;
}

// Always writes an in-app notification row; optionally fans out to the
// (currently stubbed) email/WhatsApp channels for the same event.
export async function notify(input: NotifyInput) {
  const channels = input.channels ?? ["IN_APP"];

  const record = await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      channel: channels[0] ?? "IN_APP",
      meta: input.meta ? JSON.stringify(input.meta) : null,
    },
  });

  if (channels.includes("EMAIL")) {
    const user = await prisma.user.findUnique({ where: { id: input.userId } });
    if (user?.email) await emailProvider.send(user.email, input.title, input.body);
  }

  if (channels.includes("WHATSAPP")) {
    const user = await prisma.user.findUnique({ where: { id: input.userId } });
    if (user?.phone) await whatsappProvider.send(user.phone, input.body);
  }

  return record;
}
