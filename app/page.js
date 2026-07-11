"use client";

import { useState, useEffect, useRef } from "react";

const FREE_LIMIT = 3;
const STRIPE_LINK = process.env.NEXT_PUBLIC_STRIPE_LINK || "#";

function currentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}`;
}

function readUsage() {
  if (typeof window === "undefined") return { month: currentMonthKey(), count: 0 };
  try {
    const raw = window.localStorage.getItem("tagsmith_usage");
    if (!raw) return { month: currentMonthKey(), count: 0 };
    const parsed = JSON.parse(raw);
    if (parsed.month !== currentMonthKey()) return { month: currentMonthKey(), count: 0 };
    return parsed;
  } catch {
    return { month: currentMonthKey(), count: 0 };
  }
}

function writeUsage(usage) {
  window.localStorage.setItem("tagsmith_usage", JSON.stringify(usage));
}

function isPro() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem("tagsmith_pro") === "1";
}

export default function Home() {
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [usage, setUsage] = useState({ month: currentMonthKey(), count: 0 });
  const [pro, setPro] = useState(false);
  const [copiedField, setCopiedField] = useState("");
  const formRef = useRef(null);

  useEffect(() => {
    setUsage(readUsage());
    setPro(isPro());
    const params = new URLSearchParams(window.location.search);
    if (params.get("unlocked") === "1") {
      window.localStorage.setItem("tagsmith_pro", "1");
      setPro(true);
    }
  }, []);

  const remaining = Math.max(0, FREE_LIMIT - usage.count);
  const blocked = !pro && remaining <= 0;

  function scrollToForm() {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function handleGenerate(e) {
    e.preventDefault();
    if (blocked) return;
    if (!description.trim()) {
      setError("Describe the item first — even a rough sentence works.");
      return;
    }
    setError("");
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, category }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong generating that listing.");
      setResult(data);
      if (!pro) {
        const next = { month: currentMonthKey(), count: usage.count + 1 };
        writeUsage(next);
        setUsage(next);
      }
    } catch (err) {
      setError(err.message || "Couldn't generate a listing. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  function copy(text, field) {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(""), 1500);
  }

  return (
    <main>
      <header className="topbar">
        <div className="wrap topbar-inner">
          <span className="wordmark">Tagsmith</span>
          <a className="topbar-cta" href={STRIPE_LINK} target="_blank" rel="noreferrer">
            Go unlimited — $12/mo
          </a>
        </div>
      </header>

      <section className="hero">
        <div className="wrap hero-inner">
          <div className="hero-copy">
            <p className="eyebrow">For Etsy sellers who'd rather be making things</p>
            <h1>
              Stop writing tags.
              <br />
              Start hanging them.
            </h1>
            <p className="hero-sub">
              Paste a rough description of what you made. Get back a title, all 13 tags, and a
              listing description built the way Etsy search actually rewards — every time you list
              something new.
            </p>
            <button className="btn-primary" onClick={scrollToForm}>
              Generate a listing free
            </button>
            <p className="hero-fine">No account needed for your first {FREE_LIMIT} listings.</p>
          </div>
          <div className="hero-tag" aria-hidden="true">
            <svg viewBox="0 0 260 340" className="swing-svg">
              <line x1="130" y1="0" x2="130" y2="46" stroke="var(--thread)" strokeWidth="2" />
              <path
                d="M20 60 H210 L250 150 L210 260 H20 L20 60 Z"
                fill="var(--kraft)"
                stroke="var(--ink-deep)"
                strokeWidth="2"
              />
              <circle cx="50" cy="90" r="9" fill="var(--ink)" />
              <circle cx="50" cy="90" r="9" fill="none" stroke="var(--ink-deep)" strokeWidth="2" />
              <text x="70" y="120" className="tag-svg-label">TITLE</text>
              <text x="70" y="150" className="tag-svg-value">handmade · SEO'd</text>
              <text x="70" y="195" className="tag-svg-label">TAGS ×13</text>
              <text x="70" y="225" className="tag-svg-value">ready to paste</text>
            </svg>
          </div>
        </div>
      </section>

      <section className="steps">
        <div className="wrap steps-inner">
          <div className="step">
            <span className="step-num">01</span>
            <h3>Describe it roughly</h3>
            <p>A few honest sentences about the piece. No need to sound like a copywriter.</p>
          </div>
          <div className="step">
            <span className="step-num">02</span>
            <h3>Tagsmith writes the listing</h3>
            <p>Title, 13 search tags, and a full description come back formatted for Etsy.</p>
          </div>
          <div className="step">
            <span className="step-num">03</span>
            <h3>Paste it in and list</h3>
            <p>Copy each field straight into your Etsy listing editor. Nothing to reformat.</p>
          </div>
        </div>
      </section>

      <section className="generator" ref={formRef}>
        <div className="wrap">
          <div className="card">
            <h2>Describe what you made</h2>
            <form onSubmit={handleGenerate}>
              <label htmlFor="description">Product description</label>
              <textarea
                id="description"
                rows={5}
                placeholder="e.g. Hand-thrown ceramic mug, matte oatmeal glaze, holds about 12oz, made in my home studio in small batches"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={blocked}
              />
              <label htmlFor="category">Category (optional)</label>
              <input
                id="category"
                type="text"
                placeholder="e.g. ceramics, jewelry, wall art, baby clothes"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={blocked}
              />

              {!pro && (
                <p className="usage-line">
                  {blocked
                    ? "You've used your 3 free listings this month."
                    : `${remaining} of ${FREE_LIMIT} free listings left this month.`}
                </p>
              )}

              {error && <p className="error-line">{error}</p>}

              <button className="btn-primary" type="submit" disabled={loading || blocked}>
                {loading ? "Writing your listing…" : "Generate listing"}
              </button>
            </form>

            {blocked && (
              <div className="paywall">
                <p>
                  You're out of free listings for this month. Tagsmith Unlimited is $12/mo — list
                  as many items as you want, any time.
                </p>
                <a className="btn-primary" href={STRIPE_LINK} target="_blank" rel="noreferrer">
                  Upgrade to Unlimited
                </a>
              </div>
            )}
          </div>

          {result && (
            <div className="results">
              <TagCard label="TITLE" onCopy={() => copy(result.title, "title")} copied={copiedField === "title"}>
                <p className="result-title">{result.title}</p>
              </TagCard>

              <TagCard
                label="TAGS ×13"
                onCopy={() => copy(result.tags.join(", "), "tags")}
                copied={copiedField === "tags"}
              >
                <div className="chips">
                  {result.tags.map((tag, i) => (
                    <button
                      key={i}
                      type="button"
                      className="chip"
                      onClick={() => copy(tag, `tag-${i}`)}
                      title="Click to copy"
                    >
                      {tag}
                      {copiedField === `tag-${i}` && <span className="chip-copied">copied</span>}
                    </button>
                  ))}
                </div>
              </TagCard>

              <TagCard
                label="DESCRIPTION"
                onCopy={() => copy(result.description, "description")}
                copied={copiedField === "description"}
              >
                <p className="result-desc">{result.description}</p>
              </TagCard>
            </div>
          )}
        </div>
      </section>

      <footer className="footer">
        <div className="wrap footer-inner">
          <p>
            Tagsmith — {FREE_LIMIT} free listings a month, then $12/mo unlimited.{" "}
            <a href={STRIPE_LINK} target="_blank" rel="noreferrer">
              Upgrade
            </a>
          </p>
        </div>
      </footer>

      <style jsx>{`
        .wrap {
          max-width: 1040px;
          margin: 0 auto;
          padding: 0 24px;
        }

        .topbar {
          padding: 22px 0;
          border-bottom: 1px solid rgba(242, 234, 216, 0.1);
        }
        .topbar-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .wordmark {
          font-family: var(--font-display);
          font-size: 22px;
          font-weight: 600;
          letter-spacing: 0.01em;
        }
        .topbar-cta {
          font-family: var(--font-mono);
          font-size: 13px;
          text-decoration: none;
          color: var(--gold-bright);
          border: 1px solid rgba(224, 180, 88, 0.4);
          padding: 8px 14px;
          border-radius: 3px;
          transition: background 0.15s ease, color 0.15s ease;
        }
        .topbar-cta:hover {
          background: var(--gold-bright);
          color: var(--ink-deep);
        }

        .hero {
          padding: 64px 0 48px;
        }
        .hero-inner {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 40px;
          align-items: center;
        }
        .eyebrow {
          font-family: var(--font-mono);
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--gold-bright);
          margin: 0 0 14px;
        }
        h1 {
          font-family: var(--font-display);
          font-size: clamp(36px, 5vw, 54px);
          line-height: 1.05;
          font-weight: 600;
          margin: 0 0 20px;
        }
        .hero-sub {
          font-size: 17px;
          line-height: 1.6;
          color: rgba(242, 234, 216, 0.82);
          max-width: 46ch;
          margin: 0 0 28px;
        }
        .hero-fine {
          font-size: 13px;
          color: rgba(242, 234, 216, 0.55);
          margin: 12px 0 0;
        }

        .btn-primary {
          font-family: var(--font-body);
          font-weight: 600;
          font-size: 15px;
          background: var(--gold-bright);
          color: var(--ink-deep);
          border: none;
          padding: 14px 26px;
          border-radius: 3px;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
          transition: transform 0.12s ease, box-shadow 0.12s ease;
        }
        .btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(201, 154, 62, 0.28);
        }
        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .hero-tag {
          display: flex;
          justify-content: center;
        }
        .swing-svg {
          width: 100%;
          max-width: 260px;
          animation: sway 5s ease-in-out infinite;
          transform-origin: 130px 0px;
        }
        @keyframes sway {
          0%, 100% { transform: rotate(-3deg); }
          50% { transform: rotate(3deg); }
        }
        .tag-svg-label {
          font-family: var(--font-mono);
          font-size: 13px;
          fill: var(--ink-text-soft);
          letter-spacing: 0.06em;
        }
        .tag-svg-value {
          font-family: var(--font-display);
          font-size: 20px;
          fill: var(--ink-text);
        }

        .steps {
          border-top: 1px solid rgba(242, 234, 216, 0.1);
          border-bottom: 1px solid rgba(242, 234, 216, 0.1);
          padding: 44px 0;
        }
        .steps-inner {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 32px;
        }
        .step-num {
          font-family: var(--font-mono);
          font-size: 13px;
          color: var(--gold-bright);
          display: block;
          margin-bottom: 10px;
        }
        .step h3 {
          font-family: var(--font-display);
          font-size: 19px;
          margin: 0 0 8px;
          font-weight: 500;
        }
        .step p {
          font-size: 14.5px;
          line-height: 1.55;
          color: rgba(242, 234, 216, 0.72);
          margin: 0;
        }

        .generator {
          padding: 64px 0;
        }
        .card {
          background: var(--kraft);
          color: var(--ink-text);
          border-radius: 6px;
          padding: 36px;
          max-width: 620px;
          margin: 0 auto;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);
        }
        .card h2 {
          font-family: var(--font-display);
          font-size: 24px;
          margin: 0 0 22px;
          font-weight: 600;
        }
        label {
          display: block;
          font-family: var(--font-mono);
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--ink-text-soft);
          margin: 18px 0 6px;
        }
        textarea,
        input[type="text"] {
          width: 100%;
          font-family: var(--font-body);
          font-size: 15px;
          padding: 12px 14px;
          border-radius: 4px;
          border: 1px solid rgba(35, 36, 30, 0.2);
          background: var(--kraft-light);
          color: var(--ink-text);
          resize: vertical;
        }
        textarea:focus,
        input[type="text"]:focus {
          outline: 2px solid var(--gold);
          outline-offset: 1px;
        }
        .usage-line {
          font-family: var(--font-mono);
          font-size: 12.5px;
          color: var(--ink-text-soft);
          margin: 16px 0 0;
        }
        .error-line {
          font-size: 13.5px;
          color: var(--error);
          margin: 12px 0 0;
        }
        .card .btn-primary {
          margin-top: 22px;
        }

        .paywall {
          margin-top: 26px;
          padding-top: 22px;
          border-top: 1px dashed rgba(35, 36, 30, 0.25);
        }
        .paywall p {
          font-size: 14.5px;
          line-height: 1.55;
          margin: 0 0 14px;
        }

        .results {
          max-width: 620px;
          margin: 36px auto 0;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .footer {
          border-top: 1px solid rgba(242, 234, 216, 0.1);
          padding: 28px 0 44px;
        }
        .footer-inner p {
          font-size: 13.5px;
          color: rgba(242, 234, 216, 0.55);
          margin: 0;
        }
        .footer-inner a {
          color: var(--gold-bright);
        }

        @media (max-width: 780px) {
          .hero-inner {
            grid-template-columns: 1fr;
          }
          .steps-inner {
            grid-template-columns: 1fr;
          }
          .hero-tag {
            order: -1;
          }
        }
      `}</style>
    </main>
  );
}

function TagCard({ label, children, onCopy, copied }) {
  return (
    <div className="tagcard">
      <div className="tagcard-head">
        <span className="tagcard-label">{label}</span>
        <button type="button" className="tagcard-copy" onClick={onCopy}>
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      {children}
      <style jsx>{`
        .tagcard {
          background: var(--kraft);
          color: var(--ink-text);
          border-radius: 6px;
          padding: 22px 24px 24px;
          position: relative;
        }
        .tagcard::before {
          content: "";
          position: absolute;
          top: 14px;
          left: 14px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: var(--ink);
          box-shadow: inset 0 0 0 1px rgba(35, 36, 30, 0.3);
        }
        .tagcard-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-left: 26px;
          margin-bottom: 12px;
        }
        .tagcard-label {
          font-family: var(--font-mono);
          font-size: 12px;
          letter-spacing: 0.08em;
          color: var(--ink-text-soft);
        }
        .tagcard-copy {
          font-family: var(--font-mono);
          font-size: 12px;
          background: none;
          border: 1px solid rgba(35, 36, 30, 0.25);
          color: var(--ink-text);
          padding: 5px 10px;
          border-radius: 3px;
          cursor: pointer;
        }
        .tagcard-copy:hover {
          background: rgba(35, 36, 30, 0.08);
        }
        :global(.result-title) {
          font-family: var(--font-display);
          font-size: 19px;
          font-weight: 500;
          line-height: 1.4;
          margin: 0;
          padding-left: 26px;
        }
        :global(.result-desc) {
          font-size: 14.5px;
          line-height: 1.65;
          margin: 0;
          padding-left: 26px;
          white-space: pre-wrap;
        }
        :global(.chips) {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          padding-left: 26px;
        }
        :global(.chip) {
          font-family: var(--font-mono);
          font-size: 12.5px;
          background: var(--kraft-light);
          border: 1px solid rgba(35, 36, 30, 0.2);
          color: var(--ink-text);
          padding: 6px 10px;
          border-radius: 3px;
          cursor: pointer;
          position: relative;
        }
        :global(.chip:hover) {
          border-color: var(--gold);
        }
        :global(.chip-copied) {
          margin-left: 6px;
          font-size: 10.5px;
          color: var(--gold);
        }
      `}</style>
    </div>
  );
}
