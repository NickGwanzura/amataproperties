import { Resend } from "resend";
import { db } from "@/lib/db/index";
import { notifications } from "@/lib/db/schema";
import { email as emailConfig } from "@/config";

const resend = emailConfig.apiKey ? new Resend(emailConfig.apiKey) : null;

export async function sendNotification(input: {
  recipient: string;
  subject: string;
  body: string;
  html?: string;
  channel?: "EMAIL" | "IN_APP" | "SMS";
  attachment?: { filename: string; content: Uint8Array };
}) {
  const channel = input.channel ?? "EMAIL";

  await db.insert(notifications).values({
    recipient: input.recipient,
    subject: input.subject,
    body: input.body,
    channel,
    sentAt: new Date(),
  });

  if (resend && channel === "EMAIL") {
    await resend.emails.send({
      from: `${emailConfig.fromName} <${emailConfig.from}>`,
      to: input.recipient,
      subject: input.subject,
      text: input.body,
      ...(input.html ? { html: input.html } : {}),
      ...(input.attachment
        ? {
            attachments: [
              {
                filename: input.attachment.filename,
                content: Buffer.from(input.attachment.content).toString("base64"),
              },
            ],
          }
        : {}),
    });
  }
}
