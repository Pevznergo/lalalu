"use client";

import Link from "next/link";
import { useRef, useState } from "react";

const quickPrompts = [
  { emoji: "🎂", label: "Birthday" },
  { emoji: "❤️", label: "Love" },
  { emoji: "💍", label: "Wedding" },
  { emoji: "😂", label: "Funny" },
  { emoji: "💪", label: "Hype" },
  { emoji: "🎉", label: "Party" }
];

export default function HomePage() {
  const formRef = useRef<HTMLFormElement>(null);
  const [story, setStory] = useState("");

  function submitStory(nextStory: string) {
    setStory(nextStory);
    requestAnimationFrame(() => {
      formRef.current?.requestSubmit();
    });
  }

  return (
    <main className="page">
      <header className="topbar">
        <div className="brand-wrap">
          <div className="brand">lalelu</div>
          <p className="brand-subtitle">2M+ songs created</p>
        </div>
        <Link className="profile-button" href="/my-songs" aria-label="Account">
          <span className="profile-icon">◉</span>
        </Link>
      </header>

      <section className="hero hero-center">
        <div className="hero-copy">
          <h1>Let&apos;s make a song. What should it be about?</h1>
        </div>

        <div className="starter-grid" aria-label="Song ideas">
          {quickPrompts.map(({ emoji, label }) => (
            <button
              key={label}
              className="starter-card"
              type="button"
              onClick={() => submitStory(label)}
            >
              <span className="starter-emoji" aria-hidden="true">
                {emoji}
              </span>
              <strong>{label}</strong>
            </button>
          ))}
        </div>

        <p className="hero-divider">or</p>

        <form ref={formRef} className="input-shell" action="/api/drafts" method="post">
          <input
            name="story"
            value={story}
            onChange={(event) => setStory(event.target.value)}
            placeholder="Describe your song idea..."
            aria-label="Describe your song idea"
            autoComplete="off"
            required
          />
          <button className="mic-button" type="button" aria-label="Record voice note">
            <span aria-hidden="true">🎙</span>
          </button>
          <button className="send-button" type="submit" aria-label="Build a song draft">
            ↑
          </button>
        </form>

        <p className="hero-footer">
          Terms of Service and Privacy Policy. Built for personalized song generation.
        </p>
      </section>
    </main>
  );
}
