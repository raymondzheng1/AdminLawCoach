"use client";
import { useEffect, useState } from "react";

/**
 * In-app install affordance (§19.2). Shown by DEFAULT (not gated on the
 * beforeinstallprompt event, which fires only opportunistically): a one-tap
 * Install once the event has fired, otherwise a manual hint (iOS Share -> Add to
 * Home Screen, or the browser menu). The dismiss is session-scoped (returns next
 * session); the only permanent hide is "already installed".
 */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "alc_install_dismissed"; // sessionStorage
const INSTALLED_KEY = "alc_installed"; // localStorage

export function InstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    const nav = navigator as Navigator & { standalone?: boolean };
    const standalone = window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
    if (standalone || localStorage.getItem(INSTALLED_KEY) || sessionStorage.getItem(DISMISS_KEY)) return;
    const ua = navigator.userAgent;
    if (/\bwv\b|FBAN|FBAV|Instagram|MicroMessenger/i.test(ua)) return; // can't install from an in-app browser
    setIsIos(/iphone|ipad|ipod/i.test(ua));
    setVisible(true);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      localStorage.setItem(INSTALLED_KEY, "1");
      setVisible(false);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!visible) return null;

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    try {
      await deferred.userChoice;
    } catch {
      /* user dismissed */
    }
    setDeferred(null);
    setVisible(false);
  };
  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  };

  const hint = deferred
    ? "Add it to your device for one-tap access."
    : isIos
      ? "Tap Share, then Add to Home Screen."
      : "Use Install in your browser menu to add it to your device.";

  return (
    <div className="border-b border-[var(--color-border)] bg-[var(--color-accent-soft)]">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 text-[14px]">
        <span className="font-medium">Install AdminLaw Coach</span>
        <span className="text-[var(--color-muted)]">{hint}</span>
        <span className="ml-auto flex items-center gap-2">
          {deferred ? (
            <button onClick={install} className="rounded-md bg-[var(--color-primary)] px-3 py-1.5 font-medium text-[var(--color-primary-fg)]">
              Install
            </button>
          ) : null}
          <button
            onClick={dismiss}
            aria-label="Dismiss install prompt"
            className="rounded-md px-2 py-1 text-[var(--color-muted)] hover:text-[var(--color-ink)]"
          >
            Dismiss
          </button>
        </span>
      </div>
    </div>
  );
}
