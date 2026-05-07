import { redirect } from "next/navigation";
import { db } from "@/core/db";
import { createBirthdayDraft } from "@/core/drafts";

export async function POST(request: Request) {
  const form = await request.formData();
  const recipient = String(form.get("recipient") ?? "");
  const sender = String(form.get("sender") ?? "");
  const story = String(form.get("story") ?? "");

  const user = await db.user.upsert({
    where: { email: "beta-user@lalalu.local" },
    create: { email: "beta-user@lalalu.local", displayName: "Beta User" },
    update: {}
  });

  const draft = await createBirthdayDraft({
    userId: user.id,
    story: `Песня для ${recipient}. От кого: ${sender}. Детали: ${story}`
  });

  redirect(`/api/generate?draftId=${draft.id}`);
}
