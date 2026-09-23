"use client";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Play,
  Mic,
  Square,
  RotateCcw,
  AudioLines,
  Turtle,
  Check,
} from "lucide-react";
import type { Dialog, Settings, Assessment } from "@/lib/types";
import { useAudio } from "@/lib/use-audio";
import { browserTranscriptService } from "@/lib/scoring";
export function Lesson({
  dialog,
  index,
  total,
  title,
  settings,
  onBack,
  onComplete,
}: {
  dialog: Dialog;
  index: number;
  total: number;
  title: string;
  settings: Settings;
  onBack: () => void;
  onComplete: (score: number | null) => void;
}) {
  const audio = useAudio(settings);
  const [revealed, setRevealed] = useState(false),
    [consent, setConsent] = useState(false),
    [result, setResult] = useState<Assessment | null>(null),
    [saving, setSaving] = useState(false);
  const busy = audio.recording || audio.requesting;
  return (
    <div className="lesson-wrap">
      <button className="text-button" onClick={onBack}>
        <ArrowLeft size={17} /> Zpět na téma
      </button>
      <div className="lesson-top">
        <span>{title}</span>
        <span>
          Dialog {index + 1} / {total}
        </span>
      </div>
      <div className="progress-track">
        <span style={{ width: `${((index + 1) / total) * 100}%` }} />
      </div>
      <section className="lesson-card">
        {!audio.speechAvailable && (
          <p className="notice">
            Čtení textu není v tomto prohlížeči dostupné. Otázku a odpověď si
            můžeš zobrazit a svůj hlas nahrát.
          </p>
        )}
        <div className="eyebrow">01 / POSLECHNI SI OTÁZKU</div>
        <button
          className="button secondary"
          disabled={busy || audio.playing || !audio.speechAvailable}
          onClick={() => {
            setRevealed(true);
            void audio.speak([dialog.question]);
          }}
        >
          <Play size={17} /> Přehrát otázku
        </button>{" "}
        <button className="text-button" onClick={() => setRevealed(!revealed)}>
          {revealed ? "Skrýt otázku" : "Zobrazit otázku"}
        </button>
        {revealed && (
          <div className="question">
            <h2 lang="en">{dialog.question}</h2>
            <p>{dialog.translation}</p>
          </div>
        )}
        <div className="divider" />
        <div className="eyebrow">02 / POSLOUCHEJ A OPAKUJ</div>
        <h1 className="sentence" lang="en">
          {dialog.answer}
        </h1>
        <p className="muted">{dialog.explanation}</p>
        <div className="actions">
          <button
            className="button primary"
            disabled={busy || audio.playing || !audio.speechAvailable}
            onClick={() => void audio.speak([dialog.answer])}
          >
            <Play size={18} /> Vzorová odpověď
          </button>
          <button
            className="button secondary"
            disabled={busy || audio.playing || !audio.speechAvailable}
            onClick={() => void audio.speak([dialog.answer], 0.75)}
          >
            <Turtle size={18} /> 0,75×
          </button>
          <button
            className="button secondary"
            disabled={busy || audio.playing || !audio.speechAvailable}
            onClick={() => void audio.speak(dialog.chunks, settings.rate, true)}
          >
            <AudioLines size={18} /> Shadow mode
          </button>
          {audio.playing && (
            <button className="button secondary" onClick={audio.stopSpeech}>
              <Square size={16} /> Zastavit
            </button>
          )}
        </div>
        <p className="helper">
          Shadow mode přehrává krátké úseky a nechává ti čas na zopakování.
        </p>
        <div className="cue" aria-live="polite">
          {audio.cue}
        </div>
        <details>
          <summary>Přehrát po částech</summary>
          <div className="chunks">
            {dialog.chunks.map((part, i) => (
              <button
                key={i}
                disabled={busy || audio.playing || !audio.speechAvailable}
                onClick={() => void audio.speak([part])}
              >
                <Play size={14} />
                <span lang="en">{part}</span>
              </button>
            ))}
          </div>
        </details>
        <div className="divider" />
        <div className="eyebrow">03 / TEĎ JE ŘADA NA TOBĚ</div>
        <p>Nahraj odpověď a poslechni si, jak zníš.</p>
        {audio.recognitionAvailable ? (
          <label className="consent">
            <input
              type="checkbox"
              checked={consent}
              disabled={busy}
              onChange={(e) => setConsent(e.target.checked)}
            />
            <span>
              Zapnout přepis řeči. Souhlasím s tím, že prohlížeč může odeslat
              zvuk své službě rozpoznávání. Bez této volby zůstává nahrávka
              pouze v zařízení.
            </span>
          </label>
        ) : (
          <p className="notice">
            Tento prohlížeč nepodporuje přepis řeči. Nahrávání a vlastní
            přehrávka jsou dál dostupné.
          </p>
        )}
        <div className="actions">
          {audio.recording ? (
            <>
              <button
                className="button recording"
                onClick={() => audio.stopRecording()}
              >
                <Square size={18} /> Dokončit nahrávání
              </button>
              <button
                className="text-button"
                onClick={() => audio.stopRecording(true)}
              >
                Zrušit nahrávání
              </button>
              <span role="status">● Nahrávám · nejvýše 60 s</span>
            </>
          ) : (
            <button
              className="button primary"
              disabled={audio.requesting || audio.playing}
              onClick={() => {
                setResult(null);
                void audio.startRecording(consent);
              }}
            >
              <Mic size={18} />
              {audio.requesting ? "Čekám na mikrofon…" : "Nahrát odpověď"}
            </button>
          )}
        </div>
        {audio.error && (
          <p role="alert" className="notice">
            {audio.error}
          </p>
        )}
        {audio.audioUrl && (
          <div className="playback">
            <label htmlFor="own-audio">Tvoje nahrávka</label>
            <audio id="own-audio" controls src={audio.audioUrl} />
          </div>
        )}
        {audio.transcript && (
          <div className="transcript">
            <span className="eyebrow">ROZPOZNANÝ TEXT</span>
            <p lang="en">{audio.transcript}</p>
            <button
              className="button secondary"
              disabled={busy}
              onClick={async () =>
                setResult(
                  await browserTranscriptService.assess({
                    reference: dialog.answer,
                    transcript: audio.transcript,
                  }),
                )
              }
            >
              Porovnat se vzorem
            </button>
          </div>
        )}
        {result && (
          <section className="feedback" aria-live="polite">
            <h2>Shoda přepisu</h2>
            <p className="muted">
              Porovnáváme rozpoznaná slova, nikoli výslovnost. Rozpoznávání může
              dělat chyby.
            </p>
            <div className="metrics">
              {[
                ["Přesnost slov", `${result.accuracy} %`],
                ["Plynulost", "—"],
                ["Dokončení věty", `${result.completion} %`],
                ["Celkové skóre", `${result.overall} %`],
              ].map(([label, value]) => (
                <div key={label}>
                  <strong>{value}</strong>
                  <span>{label}</span>
                </div>
              ))}
            </div>
            <p className="helper">
              Plynulost nelze z přepisu spolehlivě změřit. Celkové skóre
              odpovídá přesnosti slov; dokončení měří obsazené pozice ve větě.
            </p>
            <div className="word-results" lang="en">
              {result.words.map((word, i) => (
                <span
                  key={i}
                  className={word.status}
                  title={
                    word.status === "matched"
                      ? "Shoda"
                      : word.status === "missing"
                        ? "Vynecháno"
                        : "Odlišné slovo"
                  }
                >
                  {word.text}
                  {word.status === "missing" ? " ∅" : ""}
                </span>
              ))}
            </div>
            <p className="helper">
              Zelená: shoda · oranžová: odlišné slovo · přerušované podtržení:
              vynecháno
            </p>
            {result.extra.length > 0 && (
              <p>
                Slova navíc: <span lang="en">{result.extra.join(", ")}</span>
              </p>
            )}
          </section>
        )}
        <details className="alternatives">
          <summary>Další přirozené odpovědi</summary>
          {dialog.alternatives.map((a) => (
            <p key={a} lang="en">
              {a}
            </p>
          ))}
        </details>
        <div className="lesson-bottom">
          <button
            className="text-button"
            disabled={busy}
            onClick={() => {
              audio.reset();
              setResult(null);
            }}
          >
            <RotateCcw size={16} /> Nový pokus
          </button>
          <button
            className="button primary"
            disabled={!audio.audioUrl || busy || saving}
            onClick={() => {
              setSaving(true);
              onComplete(result?.overall ?? null);
            }}
          >
            {index === total - 1 ? (
              <Check size={18} />
            ) : (
              <ArrowRight size={18} />
            )}{" "}
            {index === total - 1 ? "Dokončit téma" : "Uložit a pokračovat"}
          </button>
        </div>
        <p className="helper">
          Pokus se uloží při pokračování. Bez porovnání uložíme dokončení bez
          skóre.
        </p>
      </section>
    </div>
  );
}
