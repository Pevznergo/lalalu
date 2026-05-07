import { redirect } from "next/navigation";
import { db } from "@/core/db";
import { createPromoCampaign, createPromoCode } from "@/admin/promo";

export async function POST(request: Request) {
  const form = await request.formData();
  const admin = await db.user.upsert({
    where: { email: "admin@lalalu.local" },
    create: { email: "admin@lalalu.local", displayName: "Admin", isAdmin: true },
    update: { isAdmin: true }
  });
  const name = String(form.get("campaign") ?? "BETA_BIRTHDAY_2026");
  const campaign = await createPromoCampaign({
    adminUserId: admin.id,
    name
  });
  const { code } = await createPromoCode({
    adminUserId: admin.id,
    campaignId: campaign.id,
    credits: Number(form.get("credits") ?? "3"),
    maxRedemptions: Number(form.get("maxRedemptions") ?? "100")
  });

  redirect(`/admin?created=${encodeURIComponent(code)}`);
}
