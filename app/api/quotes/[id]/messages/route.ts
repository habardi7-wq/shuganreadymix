import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createQuoteMessageSchema } from "@/lib/validation/quote-message";
import { logAudit } from "@/lib/audit";
import { notify } from "@/lib/notifications/service";

async function getParticipant(quoteId: string, userId: string) {
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: {
      order: { select: { customerId: true, code: true } },
      company: { select: { userId: true, name: true } },
    },
  });
  if (!quote) return null;

  const isCustomer = quote.order.customerId === userId;
  const isCompany = quote.company.userId === userId;
  if (!isCustomer && !isCompany) return null;

  return { quote, isCustomer, isCompany };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "غير مصرح" }, { status: 401 });
  }

  const { id } = await params;
  const participant = await getParticipant(id, user.id);
  if (!participant) {
    return NextResponse.json({ ok: false, error: "العرض غير موجود" }, { status: 404 });
  }

  const messages = await prisma.quoteMessage.findMany({
    where: { quoteId: id },
    select: {
      id: true,
      senderUserId: true,
      body: true,
      attachmentUrl: true,
      attachmentName: true,
      createdAt: true,
      sender: { select: { role: true } },
    },
    orderBy: { createdAt: "asc" },
    take: 200,
  });

  return NextResponse.json({
    ok: true,
    messages: messages.map((message) => ({
      id: message.id,
      body: message.body,
      attachmentUrl: message.attachmentUrl,
      attachmentName: message.attachmentName,
      createdAt: message.createdAt,
      isMine: message.senderUserId === user.id,
      senderRole: message.sender.role,
    })),
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "غير مصرح" }, { status: 401 });
  }

  const { id } = await params;
  const participant = await getParticipant(id, user.id);
  if (!participant) {
    return NextResponse.json({ ok: false, error: "العرض غير موجود" }, { status: 404 });
  }

  if (!["PENDING", "ACCEPTED"].includes(participant.quote.status)) {
    return NextResponse.json(
      { ok: false, error: "التفاوض مغلق لهذا العرض" },
      { status: 409 }
    );
  }

  const json = await req.json().catch(() => null);
  const parsed = createQuoteMessageSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" },
      { status: 400 }
    );
  }

  const message = await prisma.quoteMessage.create({
    data: {
      quoteId: id,
      senderUserId: user.id,
      body: parsed.data.body,
      attachmentUrl: parsed.data.attachmentUrl ?? null,
      attachmentName: parsed.data.attachmentName ?? null,
    },
  });

  await logAudit({
    actorUserId: user.id,
    action: "QUOTE_NEGOTIATION_MESSAGE_CREATED",
    entityType: "Quote",
    entityId: id,
    after: {
      messageId: message.id,
      hasAttachment: Boolean(message.attachmentUrl),
      bodyLength: message.body.length,
    },
  });

  const recipientId = participant.isCustomer
    ? participant.quote.company.userId
    : participant.quote.order.customerId;

  await notify({
    userId: recipientId,
    type: "QUOTE_NEGOTIATION_MESSAGE",
    title: "رسالة جديدة على عرض السعر",
    body: `وصلتك رسالة جديدة بخصوص الطلب ${participant.quote.order.code}.`,
    meta: { orderId: participant.quote.orderId, quoteId: id },
  });

  return NextResponse.json({ ok: true, message }, { status: 201 });
}
