"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";

type Step = "topic" | "style" | "chat";

const topics = [
  { emoji: "🎂", label: "Birthday" },
  { emoji: "❤️", label: "Love" },
  { emoji: "💍", label: "Wedding" },
  { emoji: "😂", label: "Funny" },
  { emoji: "💪", label: "Hype" },
  { emoji: "🎉", label: "Party" }
];

const styles = [
  { emoji: "🎤", label: "Pop" },
  { emoji: "🧢", label: "Rap / Hip-hop" },
  { emoji: "🤘", label: "Rock" },
  { emoji: "🎧", label: "Electronic" },
  { emoji: "🪕", label: "Folk" },
  { emoji: "🌼", label: "Indie" },
  { emoji: "🪩", label: "80s" },
  { emoji: "🎻", label: "Classical" }
];

export default function HomePage() {
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState<Step>("topic");
  const [topic, setTopic] = useState("");
  const [style, setStyle] = useState("");
  const [story, setStory] = useState("");
  const [showNewSongConfirm, setShowNewSongConfirm] = useState(false);

  const assistantText = useMemo(() => {
    if (step === "topic") {
      return "Let's make a song. What should it be about?";
    }
    if (step === "style") {
      return "Now choose a style, or just tell me what you feel.";
    }
    return "Write a few details and I'll turn it into a draft.";
  }, [step]);

  function pickTopic(nextTopic: string) {
    setTopic(nextTopic);
    setStory(nextTopic);
    setStep("style");
  }

  function pickStyle(nextStyle: string) {
    setStyle(nextStyle);
    const nextStory = topic ? `${topic}. Style: ${nextStyle}` : `Style: ${nextStyle}`;
    setStory(nextStory);
    setStep("chat");
  }

  function submitStory(nextStory: string) {
    setStory(nextStory);
    requestAnimationFrame(() => formRef.current?.requestSubmit());
  }

  return (
    <main className="page app-shell">
      <header className="topbar">
        <div className="brand-wrap">
          <div className="brand">lalelu</div>
          <p className="brand-subtitle">2M+ songs created</p>
        </div>
        <div className="topbar-actions">
          <button className="ghost-pill" type="button" onClick={() => setShowNewSongConfirm(true)}>
            New song
          </button>
          <Link className="profile-button" href="/my-songs" aria-label="Account">
            <span className="profile-icon">◉</span>
          </Link>
        </div>
      </header>

      {showNewSongConfirm ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setShowNewSongConfirm(false)}>
          <div className="confirm-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <button className="modal-close" type="button" aria-label="Close" onClick={() => setShowNewSongConfirm(false)}>
              ×
            </button>
            <h2>Are you sure you want to start a new song?</h2>
            <button
              className="confirm-primary"
              type="button"
              onClick={() => {
                setShowNewSongConfirm(false);
                setStep("topic");
                setTopic("");
                setStyle("");
                setStory("");
              }}
            >
              New song
            </button>
            <button className="confirm-secondary" type="button" onClick={() => setShowNewSongConfirm(false)}>
              Continue editing
            </button>
          </div>
        </div>
      ) : null}

      <section className={`hero hero-center step-${step}`}>
        <div className="hero-copy">
          <h1>{assistantText}</h1>
        </div>

        <div className="selected-row" aria-live="polite">
          {topic ? <span className="selected-chip">{topic}</span> : null}
          {style ? <span className="selected-chip selected-chip-muted">{style}</span> : null}
        </div>

        {step === "topic" ? (
          <div className="starter-grid starter-grid-topics" aria-label="Song ideas">
            {topics.map(({ emoji, label }) => (
              <button key={label} className="starter-card" type="button" onClick={() => pickTopic(label)}>
                <span className="starter-emoji" aria-hidden="true">
                  {emoji}
                </span>
                <strong>{label}</strong>
              </button>
            ))}
          </div>
        ) : null}

        {step === "style" ? (
          <div className="starter-grid starter-grid-styles" aria-label="Song styles">
            {styles.map(({ emoji, label }) => (
              <button key={label} className="starter-card starter-card-style" type="button" onClick={() => pickStyle(label)}>
                <span className="starter-emoji" aria-hidden="true">
                  {emoji}
                </span>
                <strong>{label}</strong>
              </button>
            ))}
          </div>
        ) : null}

        {step !== "topic" ? (
          <p className="hero-divider">or</p>
        ) : null}

        <form ref={formRef} className="input-shell" action="/api/drafts" method="post">
          <input
            name="story"
            value={story}
            onChange={(event) => setStory(event.target.value)}
            placeholder={step === "topic" ? "Describe your song idea..." : "Add more details..."}
            aria-label="Describe your song idea"
            autoComplete="off"
            required
          />
          <button className="mic-button" type="button" aria-label="Record voice note">
            <span aria-hidden="true">🎙</span>
          </button>
          <button className="send-button" type="button" onClick={() => submitStory(story)} aria-label="Build a song draft">
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
