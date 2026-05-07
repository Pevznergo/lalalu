import { redeemPromoCode } from "@/admin/promo";
import { db } from "@/core/db";
import { AppError } from "@/core/errors";

export async function POST(request: Request) {
  const body = (await request.json()) as { email: string; code: string; idempotencyKey?: string };
  const user = await db.user.upsert({
    where: { email: body.email },
    create: { email: body.email },
    update: {}
  });

  try {
    const ledger = await redeemPromoCode({
      userId: user.id,
      email: user.email,
      code: body.code,
      idempotencyKey: body.idempotencyKey ?? `promo:${user.id}:${body.code}`
    });
    return Response.json({ ok: true, credits: ledger.delta });
  } catch (error) {
    if (error instanceof AppError) {
      return Response.json({ ok: false, code: error.code, message: error.message }, { status: 400 });
    }
    throw error;
  }
}
