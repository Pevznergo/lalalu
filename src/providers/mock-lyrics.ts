import type { LyricsProvider } from "@/core/types";

export const mockLyricsProvider: LyricsProvider = {
  async createDraft({ messages }) {
    const last = messages.at(-1)?.content ?? "";
    const recipient = extractRecipient(last) ?? "именинник";
    const title = `Песня для ${recipient}`;
    const lyrics = `[Куплет 1]
Сегодня день, где свет теплей,
И все слова звучат добрей.
${recipient}, пусть этот новый год
Тебе удачу принесёт.

[Припев]
С днём рождения, пусть сердце поёт,
Пусть каждый день тебя к мечтам ведёт.
Мы рядом, мы любим, и это твой час,
Эта песня сегодня звучит только для нас.

[Куплет 2]
Пусть будут рядом смех и друзья,
Пусть дом согреет любовь и семья.
Пусть всё, что важно, получится вновь,
И в каждом деле живёт любовь.

[Куплет 3]
Запомним этот радостный миг,
Где каждый голос к поздравлению привык.
Пусть впереди будет светлый маршрут,
И добрые песни тебя берегут.`;

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
  const match = input.match(/(?:для|кому|имя)[:\s]+([А-ЯA-ZЁ][а-яa-zё]+)/i);
  return match?.[1];
}
