import { db } from "./db";
import { AppError } from "./errors";

export async function getBalance(userId: string) {
  const rows = await db.creditLedger.findMany({
    where: { userId },
    select: { delta: true }
  });
  return rows.reduce((sum, row) => sum + row.delta, 0);
}

export async function grantCredits(input: {
  userId: string;
  credits: number;
  reason: string;
  idempotencyKey: string;
  paymentIntentId?: string;
  generationJobId?: string;
}) {
  return db.creditLedger.upsert({
    where: { idempotencyKey: input.idempotencyKey },
    create: {
      userId: input.userId,
      delta: input.credits,
      reason: input.reason,
      idempotencyKey: input.idempotencyKey,
      paymentIntentId: input.paymentIntentId,
      generationJobId: input.generationJobId
    },
    update: {}
  });
}

export async function reserveCreditForGeneration(input: {
  userId: string;
  draftId: string;
  idempotencyKey: string;
}) {
  return db.$transaction(async (tx) => {
    const ledger = await tx.creditLedger.findMany({
      where: { userId: input.userId },
      select: { delta: true }
    });
    const reserved = await tx.creditReservation.findMany({
      where: { userId: input.userId, status: "reserved" },
      select: { creditsReserved: true }
    });
    const balance =
      ledger.reduce((sum, row) => sum + row.delta, 0) -
      reserved.reduce((sum, row) => sum + row.creditsReserved, 0);

    if (balance < 1) {
      throw new AppError("CREDIT_RESERVATION_CONFLICT", "Not enough songs left in the balance");
    }

    const existing = await tx.creditReservation.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
      include: { generationJob: true }
    });
    if (existing) return existing.generationJob;

    const job = await tx.generationJob.create({
      data: {
        userId: input.userId,
        draftId: input.draftId,
        status: "queued",
        type: "song",
        creditCost: 1
      }
    });

    await tx.creditReservation.create({
      data: {
        userId: input.userId,
        generationJobId: job.id,
        creditsReserved: 1,
        idempotencyKey: input.idempotencyKey
      }
    });

    return job;
  });
}

export async function captureReservation(generationJobId: string) {
  return db.$transaction(async (tx) => {
    const reservation = await tx.creditReservation.findUnique({
      where: { generationJobId }
    });
    if (!reservation || reservation.status === "captured") return reservation;
    if (reservation.status === "released") {
      throw new AppError("CREDIT_RESERVATION_CONFLICT", "Reservation already released");
    }

    await tx.creditLedger.create({
      data: {
        userId: reservation.userId,
        delta: -reservation.creditsReserved,
        reason: "generation_capture",
        generationJobId,
        idempotencyKey: `capture:${generationJobId}`
      }
    });

    return tx.creditReservation.update({
      where: { id: reservation.id },
      data: { status: "captured" }
    });
  });
}
