import type { LyricsProvider } from "@/core/types";

export const mockLyricsProvider: LyricsProvider = {
  async createDraft({ messages }) {
    const last = messages.at(-1)?.content ?? "";
    const recipient = extractRecipient(last) ?? "the birthday guest";
    const title = `Song for ${recipient}`;
    const lyrics = `[Verse 1]
Today feels a little brighter,
Every word a little kinder.
${recipient}, this one is made for you,
With all the things we want to say and do.

[Chorus]
Happy birthday, let your heart sing loud,
Let every day lift you above the crowd.
We are here, we care, and this is your song,
A little piece of love to carry along.

[Verse 2]
May laughter stay close, may your people stay near,
May home feel warm and every path feel clear.
May all the things that matter come true,
And may the best days keep finding you.

[Verse 3]
We will remember this moment today,
The smiles, the lights, the words we say.
May the road ahead be kind and bright,
And this song hold you through the night.`;

    return {
      title,
      lyrics,
      style: "Warm pop ballad, acoustic guitar, gentle piano, heartfelt vocals",
      voiceGender: null,
      raw: { provider: "mock", input: last }
    };
  }
};

function extractRecipient(input: string) {
  const match = input.match(/(?:for|who|name)[:\s]+([A-Z][a-z]+)/i);
  return match?.[1];
}
