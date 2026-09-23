"use client";
import { useEffect, useRef, useState } from "react";
import type { Settings } from "./types";
interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult:
    | ((event: {
        results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
      }) => void)
    | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type SpeechWindow = Window & {
  SpeechRecognition?: new () => Recognition;
  webkitSpeechRecognition?: new () => Recognition;
};
export function useAudio(settings: Settings) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]),
    [speechAvailable, setSpeechAvailable] = useState(false),
    [recognitionAvailable, setRecognitionAvailable] = useState(false);
  const [playing, setPlaying] = useState(false),
    [cue, setCue] = useState(""),
    [recording, setRecording] = useState(false),
    [requesting, setRequesting] = useState(false),
    [audioUrl, setAudioUrl] = useState(""),
    [transcript, setTranscript] = useState(""),
    [error, setError] = useState("");
  const recorder = useRef<MediaRecorder | null>(null),
    stream = useRef<MediaStream | null>(null),
    recognition = useRef<Recognition | null>(null),
    url = useRef(""),
    cancelled = useRef(false),
    generation = useRef(0),
    mounted = useRef(true),
    timeout = useRef<ReturnType<typeof setTimeout> | null>(null),
    pending = useRef(false),
    resolveSpeech = useRef<((ok: boolean) => void) | null>(null);
  useEffect(() => {
    mounted.current = true;
    // Browser capabilities are unavailable during server rendering.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSpeechAvailable("speechSynthesis" in window);
    const w = window as SpeechWindow;
    setRecognitionAvailable(
      !!(w.SpeechRecognition || w.webkitSpeechRecognition),
    );
    const update = () =>
      setVoices(
        window.speechSynthesis
          ?.getVoices()
          .filter((v) => v.lang.startsWith("en")) ?? [],
      );
    update();
    window.speechSynthesis?.addEventListener("voiceschanged", update);
    return () => {
      mounted.current = false;
      generation.current = -1;
      resolveSpeech.current?.(false);
      cancelled.current = true;
      if (timeout.current) clearTimeout(timeout.current);
      recognition.current?.abort();
      if (recorder.current?.state === "recording") recorder.current.stop();
      stream.current?.getTracks().forEach((t) => t.stop());
      window.speechSynthesis?.cancel();
      window.speechSynthesis?.removeEventListener("voiceschanged", update);
      if (url.current) URL.revokeObjectURL(url.current);
    };
  }, []);
  function stopSpeech() {
    generation.current++;
    resolveSpeech.current?.(false);
    resolveSpeech.current = null;
    window.speechSynthesis?.cancel();
    setPlaying(false);
    setCue("");
  }
  async function speak(parts: string[], rate = settings.rate, shadow = false) {
    stopSpeech();
    setError("");
    if (!("speechSynthesis" in window)) {
      setError(
        "Tento prohlížeč nepodporuje čtení textu. Věty si můžeš projít a nahrát vlastní hlas.",
      );
      return;
    }
    const token = generation.current;
    setPlaying(true);
    for (const part of parts) {
      if (token !== generation.current) break;
      setCue(part);
      const ok = await new Promise<boolean>((resolve) => {
        resolveSpeech.current = resolve;
        const u = new SpeechSynthesisUtterance(part);
        u.lang = "en-GB";
        u.rate = rate;
        u.voice =
          voices.find((v) => v.voiceURI === settings.voice) ??
          voices[0] ??
          null;
        u.onend = () => resolve(true);
        u.onerror = () => resolve(false);
        window.speechSynthesis.speak(u);
      });
      if (token !== generation.current) break;
      if (!ok) {
        setError("Hlas se nepodařilo přehrát. Zkus jiný hlas v nastavení.");
        break;
      }
      if (shadow) {
        setCue("Teď ty…");
        await new Promise((resolve) =>
          setTimeout(
            resolve,
            Math.max(1800, (part.split(" ").length * 480) / rate),
          ),
        );
      }
    }
    if (mounted.current && token === generation.current) {
      setPlaying(false);
      setCue("");
    }
  }
  function stopRecording(discard = false) {
    cancelled.current = discard;
    if (timeout.current) clearTimeout(timeout.current);
    recognition.current?.stop();
    if (recorder.current?.state === "recording") recorder.current.stop();
    stream.current?.getTracks().forEach((t) => t.stop());
    setRecording(false);
    if (discard) setTranscript("");
  }
  async function startRecording(consent: boolean) {
    if (pending.current || recorder.current?.state === "recording") return;
    stopSpeech();
    setError("");
    setTranscript("");
    recognition.current?.abort();
    recognition.current = null;
    if (url.current) {
      URL.revokeObjectURL(url.current);
      url.current = "";
      setAudioUrl("");
    }
    if (!navigator.mediaDevices?.getUserMedia || !("MediaRecorder" in window)) {
      setError(
        "Nahrávání není dostupné. Použij aktuální prohlížeč na localhost nebo HTTPS.",
      );
      return;
    }
    pending.current = true;
    setRequesting(true);
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mounted.current) {
        media.getTracks().forEach((t) => t.stop());
        return;
      }
      stream.current = media;
      cancelled.current = false;
      const chunks: BlobPart[] = [];
      const r = new MediaRecorder(media);
      recorder.current = r;
      r.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      r.onstop = () => {
        media.getTracks().forEach((t) => t.stop());
        if (!mounted.current || recorder.current !== r) return;
        if (timeout.current) clearTimeout(timeout.current);
        recognition.current?.stop();
        setRecording(false);
        if (cancelled.current) return;
        url.current = URL.createObjectURL(
          new Blob(chunks, { type: r.mimeType }),
        );
        setAudioUrl(url.current);
      };
      r.onerror = () => {
        setError("Nahrávání se přerušilo. Zkus nový pokus.");
        stopRecording(true);
      };
      r.start();
      setRecording(true);
      timeout.current = setTimeout(() => stopRecording(), 60000);
      if (consent) {
        const w = window as SpeechWindow;
        const Constructor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
        if (Constructor) {
          const rec = new Constructor();
          recognition.current = rec;
          rec.lang = "en-US";
          rec.continuous = true;
          rec.interimResults = false;
          rec.onresult = (e) => {
            if (
              !cancelled.current &&
              mounted.current &&
              recognition.current === rec
            )
              setTranscript(
                Array.from(e.results)
                  .filter((x) => x.isFinal)
                  .map((x) => x[0].transcript)
                  .join(" "),
              );
          };
          rec.onerror = (e) => {
            if (
              e.error !== "aborted" &&
              mounted.current &&
              recognition.current === rec
            )
              setError(
                "Přepis není dostupný nebo nerozpoznal řeč. Vlastní nahrávku si můžeš dál poslechnout.",
              );
          };
          try {
            rec.start();
          } catch {
            setError("Přepis se nepodařilo spustit. Nahrávání dál funguje.");
          }
        }
      }
    } catch {
      stream.current?.getTracks().forEach((t) => t.stop());
      setError(
        "Mikrofon není dostupný. Povol přístup v prohlížeči a zkontroluj připojení mikrofonu.",
      );
    } finally {
      pending.current = false;
      if (mounted.current) setRequesting(false);
    }
  }
  function reset() {
    stopSpeech();
    stopRecording(true);
    recognition.current?.abort();
    if (url.current) URL.revokeObjectURL(url.current);
    url.current = "";
    setAudioUrl("");
    setTranscript("");
    setError("");
  }
  return {
    voices,
    speechAvailable,
    recognitionAvailable,
    playing,
    cue,
    recording,
    requesting,
    audioUrl,
    transcript,
    error,
    speak,
    stopSpeech,
    startRecording,
    stopRecording,
    reset,
  };
}
