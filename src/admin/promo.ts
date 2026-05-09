import { db } from "@/core/db";
import { createOpaqueToken, normalizeCode, sha256 } from "@/core/hash";
import { grantCredits } from "@/core/credits";
import { AppError } from "@/core/errors";

export async function createPromoCampaign(input: {
  adminUserId: string;
  name: string;
  description?: string;
  expiresAt?: Date;
}) {
  return db.promoCampaign.create({
    data: {
      createdByAdminId: input.adminUserId,
      name: input.name,
      description: input.description,
      expiresAt: input.expiresAt
    }
  });
}

export async function createPromoCode(input: {
  adminUserId: string;
  campaignId: string;
  credits: number;
  maxRedemptions: number;
  perUserLimit?: number;
  expiresAt?: Date;
}) {
  const code = createOpaqueToken("LALA");
  const normalized = normalizeCode(code);
  const promo = await db.promoCode.create({
    data: {
      campaignId: input.campaignId,
      codeHash: sha256(normalized),
      displayPrefix: normalized.slice(0, 9),
      credits: input.credits,
      maxRedemptions: input.maxRedemptions,
      perUserLimit: input.perUserLimit ?? 1,
      expiresAt: input.expiresAt
    }
  });

  await db.adminAuditEvent.create({
    data: {
      adminUserId: input.adminUserId,
      action: "promo_code.create",
      targetType: "promo_code",
      targetId: promo.id,
      reason: "Generated promo code",
      payloadJson: { credits: input.credits, maxRedemptions: input.maxRedemptions }
    }
  });

  return { promo, code };
}

export async function redeemPromoCode(input: {
  userId: string;
  email?: string | null;
  code: string;
  idempotencyKey: string;
}) {
  const normalized = normalizeCode(input.code);
  const codeHash = sha256(normalized);

  return db.$transaction(async (tx) => {
    const promo = await tx.promoCode.findUnique({
      where: { codeHash },
      include: { redemptions: true }
    });

    if (!promo || promo.status !== "active") {
      throw new AppError("PROMO_CODE_INVALID");
    }
    if (promo.expiresAt && promo.expiresAt < new Date()) {
      throw new AppError("PROMO_CODE_INVALID", "Promo code has expired");
    }
    if (promo.redemptions.length >= promo.maxRedemptions) {
      throw new AppError("PROMO_CODE_INVALID", "Promo code has been fully redeemed");
    }
    const userRedemptions = promo.redemptions.filter((row) => row.userId === input.userId);
    if (userRedemptions.length >= promo.perUserLimit) {
      throw new AppError("PROMO_CODE_INVALID", "You already used this promo code");
    }
    if (
      promo.allowedEmailDomain &&
      !input.email?.toLowerCase().endsWith(`@${promo.allowedEmailDomain.toLowerCase()}`)
    ) {
      throw new AppError("PROMO_CODE_INVALID", "Promo code is not available for this email address");
    }

    const ledger = await tx.creditLedger.create({
      data: {
        userId: input.userId,
        delta: promo.credits,
        reason: "promo_code",
        idempotencyKey: `promo:${promo.id}:${input.idempotencyKey}`
      }
    });

    await tx.promoRedemption.create({
      data: {
        promoCodeId: promo.id,
        userId: input.userId,
        creditLedgerId: ledger.id,
        idempotencyKey: input.idempotencyKey,
        metadataJson: { displayPrefix: promo.displayPrefix }
      }
    });

    return ledger;
  });
}
