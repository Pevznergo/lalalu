"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Step = "topic" | "style" | "chat" | "typing";
type Role = "assistant" | "user";

type Message = {
  id: string;
  role: Role;
  text: string;
  typing?: boolean;
  revealText?: string;
};

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
  { emoji: "🌼", label: "Indie" }
];

export default function HomePage() {
  const formRef = useRef<HTMLFormElement>(null);
  const timerRefs = useRef<number[]>([]);
  const [step, setStep] = useState<Step>("topic");
  const [topic, setTopic] = useState("");
  const [style, setStyle] = useState("");
  const [story, setStory] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "a0",
      role: "assistant",
      text: "Let's make a song. What should it be about?"
    }
  ]);
  const [showNewSongConfirm, setShowNewSongConfirm] = useState(false);

  useEffect(() => () => {
    timerRefs.current.forEach((timer) => window.clearTimeout(timer));
    timerRefs.current = [];
  }, []);

  function pushAssistant(text: string, typingMs = 900, revealMs = 600) {
    const typingId = crypto.randomUUID();
    const replyId = crypto.randomUUID();
    setMessages((current) => [
      ...current,
      { id: typingId, role: "assistant", text: "Thinking...", typing: true }
    ]);
    const timer = window.setTimeout(() => {
      setMessages((current) => current.map((message) => (
        message.id === typingId ? { ...message, typing: false, text: "" } : message
      )).concat({
        id: replyId,
        role: "assistant",
        text: "",
        revealText: ""
      }));

      const chars = Array.from(text);
      chars.forEach((_, index) => {
        const charTimer = window.setTimeout(() => {
          setMessages((current) => current.map((message) => {
            if (message.id !== replyId) return message;
            const nextText = chars.slice(0, index + 1).join("");
            return { ...message, revealText: nextText, text: nextText };
          }));
        }, Math.max(30, Math.floor(revealMs / Math.max(chars.length, 1))) * (index + 1));
        timerRefs.current.push(charTimer);
      });
    }, typingMs);
    timerRefs.current.push(timer);
  }

  function pushUser(text: string) {
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: "user", text }]);
  }

  function resetFlow() {
    setStep("topic");
    setTopic("");
    setStyle("");
    setStory("");
    setMessages([{ id: "a0", role: "assistant", text: "Let's make a song. What should it be about?" }]);
  }

  function pickTopic(nextTopic: string) {
    setTopic(nextTopic);
    setStory(nextTopic);
    setStep("style");
    pushUser(nextTopic);
    pushAssistant("Now choose a style, or just tell me what you feel.", 1000, 700);
  }

  function pickStyle(nextStyle: string) {
    setStyle(nextStyle);
    const nextStory = topic ? `${topic}. Style: ${nextStyle}` : `Style: ${nextStyle}`;
    setStory(nextStory);
    setStep("chat");
    pushUser(nextStyle);
    pushAssistant("Now tell me a few details. Who is it for? What should it say?", 1100, 820);
  }

  function submitStory(nextStory: string) {
    if (!nextStory.trim()) return;
    setStory(nextStory);
    setStep("typing");
    pushUser(nextStory);
    pushAssistant("Got it. I&apos;m shaping the draft now... 🎶", 1400, 950);
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
                resetFlow();
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
        {step === "topic" ? (
          <div className="hero-copy">
            <p className="hero-intro">Let&apos;s make a song. What should it be about?</p>
          </div>
        ) : null}

        <div className="selected-row" aria-live="polite">
          {topic ? <span className="selected-chip">{topic}</span> : null}
          {style ? <span className="selected-chip selected-chip-muted">{style}</span> : null}
        </div>

        <div className="chat-panel">
          {messages.map((message) => (
            <div key={message.id} className={`chat-row chat-row-${message.role}`}>
              <div className={`chat-bubble chat-bubble-${message.role} ${message.typing ? "chat-bubble-typing" : ""}`}>
                {message.typing ? <span className="typing-dots" aria-label="Typing">⋯</span> : (message.revealText ?? message.text)}
              </div>
            </div>
          ))}
        </div>

        <div className={`starter-stack ${step !== "topic" ? "starter-stack-small" : ""}`}>
          <div className="starter-grid starter-grid-topics" aria-label="Song ideas">
            {topics.map(({ emoji, label }) => (
              <button key={label} className={`starter-card ${topic === label ? "starter-card-selected" : ""}`} type="button" onClick={() => pickTopic(label)}>
                <span className="starter-emoji" aria-hidden="true">
                  {emoji}
                </span>
                <strong>{label}</strong>
              </button>
            ))}
          </div>

          <div className="starter-grid starter-grid-styles" aria-label="Song styles">
            {styles.map(({ emoji, label }) => (
              <button key={label} className={`starter-card starter-card-style ${style === label ? "starter-card-selected" : ""}`} type="button" onClick={() => pickStyle(label)}>
                <span className="starter-emoji" aria-hidden="true">
                  {emoji}
                </span>
                <strong>{label}</strong>
              </button>
            ))}
          </div>
        </div>

        <p className="hero-divider">or</p>

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
