import { db } from "@/core/db";
import { createPromoCampaign, createPromoCode } from "@/admin/promo";

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@lalalu.local";
  const admin = await db.user.upsert({
    where: { email: adminEmail },
    create: { email: adminEmail, displayName: "Admin", isAdmin: true },
    update: { isAdmin: true }
  });

  const campaign = await createPromoCampaign({
    adminUserId: admin.id,
    name: "BETA_BIRTHDAY_2026",
    description: "Closed beta birthday-song credits"
  });
  const { code } = await createPromoCode({
    adminUserId: admin.id,
    campaignId: campaign.id,
    credits: 3,
    maxRedemptions: 100
  });

  console.log(`Seeded admin: ${adminEmail}`);
  console.log(`Seeded promo code: ${code}`);
}

main()
  .finally(() => db.$disconnect())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
