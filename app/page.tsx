"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";

type Step = "topic" | "style" | "details" | "generating" | "ready" | "error";
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

const initialMessage = "Let's make a song. What should it be about?";

export default function HomePage() {
  const timerRefs = useRef<number[]>([]);
  const [step, setStep] = useState<Step>("topic");
  const [topic, setTopic] = useState("");
  const [style, setStyle] = useState("");
  const [details, setDetails] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNewSongConfirm, setShowNewSongConfirm] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: "a0", role: "assistant", text: initialMessage }
  ]);

  useEffect(() => () => {
    timerRefs.current.forEach((timer) => window.clearTimeout(timer));
    timerRefs.current = [];
  }, []);

  function clearTimers() {
    timerRefs.current.forEach((timer) => window.clearTimeout(timer));
    timerRefs.current = [];
  }

  function pushAssistant(text: string, typingMs = 650, revealMs = 620) {
    const typingId = crypto.randomUUID();
    const replyId = crypto.randomUUID();
    setMessages((current) => [...current, { id: typingId, role: "assistant", text: "", typing: true }]);

    const timer = window.setTimeout(() => {
      setMessages((current) => current
        .filter((message) => message.id !== typingId)
        .concat({ id: replyId, role: "assistant", text: "", revealText: "" }));

      const chars = Array.from(text);
      chars.forEach((_, index) => {
        const charTimer = window.setTimeout(() => {
          setMessages((current) => current.map((message) => {
            if (message.id !== replyId) return message;
            const nextText = chars.slice(0, index + 1).join("");
            return { ...message, revealText: nextText, text: nextText };
          }));
        }, Math.max(18, Math.floor(revealMs / Math.max(chars.length, 1))) * (index + 1));
        timerRefs.current.push(charTimer);
      });
    }, typingMs);
    timerRefs.current.push(timer);
  }

  function pushUser(text: string) {
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: "user", text }]);
  }

  function resetFlow() {
    clearTimers();
    setStep("topic");
    setTopic("");
    setStyle("");
    setDetails("");
    setInputValue("");
    setIsSubmitting(false);
    setMessages([{ id: "a0", role: "assistant", text: initialMessage }]);
  }

  function chooseTopic(nextTopic: string) {
    if (isSubmitting || step !== "topic") return;
    setTopic(nextTopic);
    setInputValue("");
    setStep("style");
    pushUser(nextTopic);
    pushAssistant("Choose the sound for it. You can pick a style or type your own.");
  }

  function chooseStyle(nextStyle: string) {
    if (isSubmitting || step !== "style") return;
    setStyle(nextStyle);
    setInputValue("");
    setStep("details");
    pushUser(nextStyle);
    pushAssistant("Tell me who it is for and what the song should say.");
  }

  async function createSong(finalDetails: string) {
    setIsSubmitting(true);
    setStep("generating");
    pushAssistant("Creating the draft and generating two versions now.");

    try {
      const response = await fetch("/api/drafts", {
        method: "POST",
        headers: {
          "accept": "application/json",
          "content-type": "application/json"
        },
        body: JSON.stringify({
          topic,
          style,
          story: finalDetails
        })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? "Song creation failed");
      }

      const payload = await response.json();
      const isReady = payload.status === "ready" || payload.status === "partially_ready";
      setStep("ready");
      pushAssistant(isReady
        ? "Your song is ready. Opening your songs now."
        : "Your song is queued. Opening your songs so you can watch progress.");

      const redirectTimer = window.setTimeout(() => {
        window.location.href = "/my-songs";
      }, 900);
      timerRefs.current.push(redirectTimer);
    } catch (error) {
      setStep("error");
      setIsSubmitting(false);
      pushAssistant(error instanceof Error ? error.message : "Song creation failed. Try again.");
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = inputValue.trim();
    if (!value || isSubmitting) return;

    pushUser(value);
    setInputValue("");

    if (step === "topic") {
      setTopic(value);
      setStep("style");
      pushAssistant("Choose the sound for it. You can pick a style or type your own.");
      return;
    }

    if (step === "style") {
      setStyle(value);
      setStep("details");
      pushAssistant("Tell me who it is for and what the song should say.");
      return;
    }

    if (step === "details" || step === "error") {
      setDetails(value);
      void createSong(value);
    }
  }

  const inputPlaceholder = step === "topic"
    ? "Type an idea or pick one..."
    : step === "style"
      ? "Type a style or pick one..."
      : "Add names, mood, story, inside jokes...";

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
            <h2>Start a new song?</h2>
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
        <div className="selected-row" aria-live="polite">
          {topic ? <span className="selected-chip">{topic}</span> : null}
          {style ? <span className="selected-chip selected-chip-muted">{style}</span> : null}
          {step === "generating" ? <span className="selected-chip selected-chip-muted">Generating</span> : null}
        </div>

        <div className="chat-panel" aria-live="polite">
          {messages.map((message) => (
            <div key={message.id} className={`chat-row chat-row-${message.role}`}>
              <div className={`chat-bubble chat-bubble-${message.role} ${message.typing ? "chat-bubble-typing" : ""}`}>
                {message.typing ? <span className="typing-dots" aria-label="Typing">...</span> : (message.revealText ?? message.text)}
              </div>
            </div>
          ))}
        </div>

        {step === "topic" ? (
          <div className="starter-grid starter-grid-topics" aria-label="Song ideas">
            {topics.map(({ emoji, label }) => (
              <button key={label} className="starter-card" type="button" onClick={() => chooseTopic(label)}>
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
              <button key={label} className="starter-card starter-card-style" type="button" onClick={() => chooseStyle(label)}>
                <span className="starter-emoji" aria-hidden="true">
                  {emoji}
                </span>
                <strong>{label}</strong>
              </button>
            ))}
          </div>
        ) : null}

        <form className="input-shell" onSubmit={handleSubmit}>
          <input
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            placeholder={inputPlaceholder}
            aria-label="Describe your song"
            autoComplete="off"
            disabled={isSubmitting}
          />
          <button className="mic-button" type="button" aria-label="Record voice note" disabled={isSubmitting}>
            <span aria-hidden="true">🎙</span>
          </button>
          <button className="send-button" type="submit" aria-label="Continue" disabled={isSubmitting}>
            {isSubmitting ? "…" : "↑"}
          </button>
        </form>

        {details ? <p className="hero-footer">Draft details saved. You can start a new song anytime.</p> : null}
      </section>
    </main>
  );
}
