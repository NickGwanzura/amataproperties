import { z } from "zod";

const velocityPaymentSchema = z.object({
  amount: z.number().positive(),
  currency: z.literal("USD"),
  reference: z.string().min(4),
  customerPhone: z.string().min(7)
});

export async function collectVelocityInstallment(input: z.infer<typeof velocityPaymentSchema>) {
  const payload = velocityPaymentSchema.parse(input);

  if (!process.env.VELOCITY_API_URL || !process.env.VELOCITY_API_KEY) {
    throw new Error("Velocity integration is not configured.");
  }

  const response = await fetch(`${process.env.VELOCITY_API_URL}/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.VELOCITY_API_KEY}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Velocity payment failed with status ${response.status}.`);
  }

  return response.json() as Promise<{ trace: string; status: string }>;
}
