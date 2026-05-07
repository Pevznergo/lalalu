import { db } from "@/core/db";
import { getLyricsProvider } from "@/providers";

export async function createBirthdayDraft(input: {
  userId?: string;
  story: string;
}) {
  const provider = getLyricsProvider();
  const song = await provider.createDraft({
    schemaVersion: "web-v1",
    messages: [{ role: "user", content: input.story }]
  });

  return db.songDraft.create({
    data: {
      userId: input.userId,
      title: song.title,
      lyrics: song.lyrics,
      style: song.style,
      voiceGender: song.voiceGender,
      messages: {
        create: [
          { role: "user", content: input.story },
          {
            role: "assistant",
            content: JSON.stringify(song),
            structuredSongJson: JSON.parse(JSON.stringify(song))
          }
        ]
      }
    }
  });
}
