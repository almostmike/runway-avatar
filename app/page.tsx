'use client';

import { useState, useCallback, useEffect } from 'react';
import { AvatarCall } from '@runwayml/avatars-react';
import '@runwayml/avatars-react/styles.css';

const AVATAR_ID = 'fd91d969-a447-4889-bb41-7176f2ad92f5';

type AppState = 'landing' | 'calling' | 'ended';

type SessionCreds = { sessionId: string; sessionKey: string };

function LandingScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="landing">
      <div className="character-wrap">
        {/* Drop character.png into /public — hides gracefully if missing */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/character.png"
          alt="Cartoon Mike"
          className="character-img"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>

      <h1 className="headline">Talk to Cartoon Mike</h1>
      <p className="subhead">AI researcher. 100+ patents. Slightly evil.</p>

      <p className="body-text">
        I built an AI-powered cartoon version of myself that you can actually talk to.
        He knows about my AI research, my years at PayPal, and has strong opinions about
        which LLMs are overhyped. Fair warning: he&apos;s a little theatrical.
      </p>

      <button className="btn-start" onClick={onStart}>
        Start conversation
      </button>
      <p className="disclaimer">Requires microphone access · Sessions last up to 1 minute</p>
    </div>
  );
}

function CallingScreen({
  avatarId,
  onEnd,
}: {
  avatarId: string;
  onEnd: () => void;
}) {
  const [creds, setCreds] = useState<SessionCreds | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Intercept getUserMedia before the SDK calls it — strip video so the
  // browser only asks for microphone permission, not camera.
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) return;
    const original = navigator.mediaDevices.getUserMedia.bind(
      navigator.mediaDevices
    );
    navigator.mediaDevices.getUserMedia = (constraints) => {
      if (constraints?.video) {
        return original({ ...constraints, video: false });
      }
      return original(constraints);
    };
    return () => {
      navigator.mediaDevices.getUserMedia = original;
    };
  }, []);

  useEffect(() => {
    fetch('/api/avatar/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatarId }),
    })
      .then((r) => {
        if (!r.ok) return r.json().then((d) => Promise.reject(d.error ?? 'Failed to start session'));
        return r.json();
      })
      .then((data: SessionCreds) => setCreds(data))
      .catch((msg: string) => setError(typeof msg === 'string' ? msg : 'Failed to start session'));
  }, [avatarId]);

  if (error) {
    return (
      <div className="calling">
        <p className="calling-error">Could not start session: {error}</p>
        <button className="btn-start" style={{ marginTop: '1.5rem' }} onClick={onEnd}>
          Go back
        </button>
      </div>
    );
  }

  if (!creds) {
    return (
      <div className="calling">
        <p className="calling-label">
          <span className="calling-dot" />
          Starting session…
        </p>
        <div className="calling-placeholder" />
      </div>
    );
  }

  return (
    <div className="calling">
      <p className="calling-label">
        <span className="calling-dot" />
        Live session
      </p>
      <div className="avatar-call-wrap">
        <AvatarCall
          avatarId={avatarId}
          sessionId={creds.sessionId}
          sessionKey={creds.sessionKey}
          onEnd={onEnd}
          onError={(err) => {
            console.error('Avatar error:', err);
            onEnd();
          }}
        />
      </div>
    </div>
  );
}

function EndedScreen({ onReset }: { onReset: () => void }) {
  return (
    <div className="ended">
      <p className="ended-eyebrow">Session ended</p>
      <h2 className="ended-headline">Want more Cartoon Mike?</h2>

      <div className="ended-buttons">
        <a
          href="https://todasco.substack.com"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-action"
        >
          Read the newsletter
        </a>
        <a
          href="https://todasco.lovable.app"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-action"
        >
          Visit the site
        </a>
        <button className="btn-action btn-action-primary" onClick={onReset}>
          Start another conversation
        </button>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <p className="footer-text">Built by Mike Todasco · Powered by Runway Characters</p>
      <div className="footer-links">
        <a
          href="https://todasco.substack.com"
          target="_blank"
          rel="noopener noreferrer"
          className="footer-link"
        >
          todasco.substack.com
        </a>
        <a
          href="https://todasco.lovable.app"
          target="_blank"
          rel="noopener noreferrer"
          className="footer-link"
        >
          todasco.lovable.app
        </a>
      </div>
    </footer>
  );
}

export default function Home() {
  const [appState, setAppState] = useState<AppState>('landing');

  const handleStart = useCallback(() => setAppState('calling'), []);
  const handleEnd = useCallback(() => setAppState('ended'), []);
  const handleReset = useCallback(() => setAppState('landing'), []);

  return (
    <div className="app-shell">
      <main className="app-main">
        {appState === 'landing' && <LandingScreen onStart={handleStart} />}
        {appState === 'calling' && (
          <CallingScreen avatarId={AVATAR_ID} onEnd={handleEnd} />
        )}
        {appState === 'ended' && <EndedScreen onReset={handleReset} />}
      </main>
      <Footer />
    </div>
  );
}
