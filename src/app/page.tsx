"use client";
import { useEffect, useState } from "react";
import {
  AudioLines,
  ArrowUpRight,
  ArrowRight,
  Play,
  BookOpen,
  ChartNoAxesCombined,
  Settings2,
  House,
  BriefcaseBusiness,
  Users,
  Coffee,
  Lightbulb,
  MessagesSquare,
  Plane,
  Utensils,
  Sparkles,
  BadgeCheck,
  Check,
  Headphones,
  Mic,
  Repeat2,
  Clock3,
  ChevronRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { topics } from "@/data/topics";
import type { Level, Progress, Settings, Topic } from "@/lib/types";
import {
  defaultSettings,
  parseProgress,
  parseSettings,
  PROGRESS_KEY,
  recordAttempt,
  SETTINGS_KEY,
} from "@/lib/storage";
import { useAudio } from "@/lib/use-audio";
import { Lesson } from "@/components/lesson";
type View = "home" | "topics" | "detail" | "lesson" | "progress" | "settings";
const icons: Record<string, LucideIcon> = {
  briefcase: BriefcaseBusiness,
  users: Users,
  coffee: Coffee,
  lightbulb: Lightbulb,
  messages: MessagesSquare,
  chart: ChartNoAxesCombined,
  plane: Plane,
  utensils: Utensils,
  sparkles: Sparkles,
  badge: BadgeCheck,
};
const navigation: { id: View; label: string; icon: LucideIcon }[] = [
  { id: "home", label: "Přehled", icon: House },
  { id: "topics", label: "Témata", icon: BookOpen },
  { id: "progress", label: "Můj pokrok", icon: ChartNoAxesCombined },
  { id: "settings", label: "Nastavení", icon: Settings2 },
];
function TopicCard({
  topic,
  progress,
  onClick,
}: {
  topic: Topic;
  progress: Progress;
  onClick: () => void;
}) {
  const Icon = icons[topic.icon];
  const count = topic.dialogs.filter((d) => progress[d.id]?.completed).length;
  return (
    <button className="topic-card" onClick={onClick}>
      <div className="card-top">
        <span className={`topic-icon ${topic.color}`}>
          <Icon size={23} strokeWidth={1.6} />
        </span>
        <span className="level">{topic.level}</span>
      </div>
      <h3>{topic.title}</h3>
      <p>{topic.description}</p>
      <div className="card-bottom">
        <span>{count ? `${count} / 5 dokončeno` : "5 dialogů · 8–12 min"}</span>
        <ArrowUpRight size={19} />
      </div>
    </button>
  );
}
export default function Home() {
  const [view, setView] = useState<View>("home"),
    [selected, setSelected] = useState(topics[0]),
    [index, setIndex] = useState(0),
    [filter, setFilter] = useState("all"),
    [progress, setProgress] = useState<Progress>({}),
    [settings, setSettings] = useState<Settings>(defaultSettings),
    [ready, setReady] = useState(false),
    [notice, setNotice] = useState("");
  useEffect(() => {
    try {
      // Browser storage must be read after hydration; this is a one-time initialization.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProgress(parseProgress(localStorage.getItem(PROGRESS_KEY)));
      setSettings(parseSettings(localStorage.getItem(SETTINGS_KEY)));
    } catch {
      setNotice(
        "Úložiště prohlížeče není dostupné. Pokrok zůstane jen do zavření stránky.",
      );
    }
    setReady(true);
  }, []);
  const completed = Object.values(progress).filter((p) => p.completed).length;
  const attempts = Object.values(progress).reduce(
    (sum, p) => sum + p.attempts,
    0,
  );
  const scores = Object.values(progress).flatMap((p) =>
    p.bestScore === null ? [] : [p.bestScore],
  );
  const average = scores.length
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : null;
  const latest = Object.entries(progress).sort((a, b) =>
    b[1].lastActivity.localeCompare(a[1].lastActivity),
  )[0];
  const continueTopic =
    topics.find((t) => t.dialogs.some((d) => d.id === latest?.[0])) ??
    topics.find((t) => t.level === settings.difficulty) ??
    topics[0];
  function navigate(next: View) {
    setView(next);
    setNotice("");
    window.scrollTo({ top: 0 });
  }
  function openTopic(topic: Topic) {
    setSelected(topic);
    navigate("detail");
  }
  function start(topic: Topic, dialogIndex = 0) {
    setSelected(topic);
    setIndex(dialogIndex);
    navigate("lesson");
  }
  function saveAttempt(score: number | null) {
    const next = recordAttempt(progress, selected.dialogs[index].id, score);
    setProgress(next);
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
    } catch {
      setNotice(
        "Pokrok se nepodařilo uložit na disk. V této relaci zůstává dostupný.",
      );
    }
    if (index < selected.dialogs.length - 1) setIndex(index + 1);
    else {
      setView("detail");
      setNotice("Skvělá práce. Poslední dialog máš za sebou!");
    }
    window.scrollTo({ top: 0 });
  }
  function updateSettings(next: Settings) {
    setSettings(next);
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
      setNotice("Nastavení uloženo.");
    } catch {
      setNotice("Nastavení platí pro tuto relaci; úložiště není dostupné.");
    }
  }
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Přeskočit na obsah
      </a>
      <aside className="sidebar">
        <button
          className="brand"
          onClick={() => navigate("home")}
          aria-label="Talkie — úvod"
        >
          <span className="brand-mark">
            <AudioLines size={24} />
          </span>
          talkie<span className="brand-dot">.</span>
        </button>
        <span className="sidebar-label">TVŮJ PROSTOR PRO ANGLIČTINU</span>
        <nav aria-label="Hlavní navigace">
          {navigation.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              aria-label={label}
              className={`nav-item ${view === id || (id === "topics" && ["detail", "lesson"].includes(view)) ? "active" : ""}`}
              aria-current={view === id ? "page" : undefined}
              onClick={() => navigate(id)}
            >
              <Icon size={20} />
              <span>{label}</span>
              {id === "topics" && <span className="nav-count">10</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-tip">
          <span className="tiny-icon">
            <AudioLines size={22} />
          </span>
          <strong>
            Malé kroky.
            <br />
            Velký rozdíl.
          </strong>
          <p>I pár minut denně pomůže najít tvůj přirozený hlas.</p>
          <span>TVÝM TEMPEM, PO SVÉM</span>
        </div>
        <div className="profile">
          <span className="avatar">TY</span>
          <div>
            <strong>Tvůj osobní prostor</strong>
            <small>Pokrok uložený v zařízení</small>
          </div>
          <span className="online-dot" />
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <span>
            Uč se mluvit. <strong>Buď sám sebou.</strong>
          </span>
          <span className="local-badge">
            <span className="online-dot" /> Bez účtu. Vlastním tempem.
          </span>
        </header>
        <main id="main-content" tabIndex={-1}>
          {notice && (
            <div role="status" className="notice global-notice">
              {notice}
            </div>
          )}
          {!ready ? (
            <p className="muted">Načítám tvůj prostor…</p>
          ) : (
            <>
              {view === "home" && (
                <>
                  <div className="page-heading">
                    <div>
                      <div className="eyebrow">
                        TROCHU ANGLIČTINY, KAŽDÝ DEN
                      </div>
                      <h1>Tvůj hlas. Větší jistota.</h1>
                      <p>Nemusíš znát každé slovo. Začni mluvit.</p>
                    </div>
                    <span className="date-label">
                      <Sparkles size={16} /> Dnes je dobrý den začít
                    </span>
                  </div>
                  <section className="hero">
                    <div className="hero-copy">
                      <span className="hero-tag">
                        <span /> POSLOUCHEJ. OPAKUJ. MLUV.
                      </span>
                      <h2>
                        Angličtina, která
                        <br />
                        zní jako <em>ty.</em>
                      </h2>
                      <p>
                        Najdi přirozený rytmus angličtiny. Krátké dialogy ze
                        skutečného života, pár minut denně a pokaždé o trochu
                        víc jistoty.
                      </p>
                      <button
                        className="button dark"
                        onClick={() =>
                          start(
                            continueTopic,
                            Math.max(
                              0,
                              continueTopic.dialogs.findIndex(
                                (d) => !progress[d.id]?.completed,
                              ),
                            ),
                          )
                        }
                      >
                        {completed
                          ? "Pokračovat v procvičování"
                          : "Začít procvičovat"}
                        <ArrowRight size={18} />
                      </button>
                      <span className="hero-note">
                        <Headphones size={14} /> Sluchátka vítána. Dokonalost
                        není potřeba.
                      </span>
                    </div>
                    <div className="hero-art" aria-hidden="true">
                      <div className="orbit orbit-one" />
                      <div className="orbit orbit-two" />
                      <span className="floating-label">
                        <span className="online-dot" /> A LITTLE BETTER, EVERY
                        DAY
                      </span>
                      <div className="sound-card">
                        <span className="sound-icon">
                          <AudioLines size={27} />
                        </span>
                        <div className="waveform">
                          {Array.from({ length: 29 }, (_, i) => (
                            <i
                              key={i}
                              style={{
                                height: `${[12, 22, 16, 37, 55, 30, 68, 44, 78, 56, 32, 62, 85, 48, 70, 37, 60, 80, 45, 28, 58, 34, 48, 24, 38, 18, 27, 14, 8][i]}px`,
                              }}
                            />
                          ))}
                        </div>
                        <span className="sound-time">00:08</span>
                      </div>
                      <div className="quote-card">
                        <span className="quote-mark">“</span>
                        <span lang="en">It’s going pretty well.</span>
                        <small>A zítra to půjde ještě líp.</small>
                        <span className="quote-check">
                          <Check size={16} />
                        </span>
                      </div>
                      <span className="art-caption">
                        MALÝ ROZHOVOR. NOVÉ MOŽNOSTI.
                      </span>
                    </div>
                  </section>
                  <section
                    className="how-grid"
                    aria-label="Jak funguje shadowing"
                  >
                    {[
                      {
                        icon: Headphones,
                        title: "Nejdřív poslouchej",
                        text: "Vnímej rytmus a melodii věty.",
                      },
                      {
                        icon: Repeat2,
                        title: "Chyť rytmus",
                        text: "Opakuj krátké úseky vlastním hlasem.",
                      },
                      {
                        icon: Mic,
                        title: "Poslechni si svůj pokrok",
                        text: "Nahraj se, porovnej a zkus to znovu.",
                      },
                    ].map(({ icon: Icon, title, text }, i) => (
                      <div key={title} className="how-item">
                        <span className="step-icon">
                          <Icon size={22} />
                        </span>
                        <div>
                          <h3>
                            <small>0{i + 1}</small> {title}
                          </h3>
                          <p>{text}</p>
                        </div>
                      </div>
                    ))}
                  </section>
                  <div className="section-heading">
                    <div>
                      <div className="eyebrow">
                        SKUTEČNÝ ŽIVOT, SKUTEČNÉ ROZHOVORY
                      </div>
                      <h2>O čem budeš dnes mluvit?</h2>
                    </div>
                    <button
                      className="text-button"
                      onClick={() => navigate("topics")}
                    >
                      Všechna témata <ArrowRight size={16} />
                    </button>
                  </div>
                  <div className="topic-grid">
                    {topics.slice(0, 3).map((t) => (
                      <TopicCard
                        key={t.id}
                        topic={t}
                        progress={progress}
                        onClick={() => openTopic(t)}
                      />
                    ))}
                  </div>
                  <section className="progress-banner">
                    <span className="progress-banner-icon">
                      <ChartNoAxesCombined size={25} />
                    </span>
                    <div>
                      <h3>Každý rozhovor se počítá.</h3>
                      <p>
                        {completed
                          ? `Máš za sebou ${completed} z 50 dialogů. Navážeme na ně?`
                          : "Tvůj první rozhovor je začátek. O zbytek se postará pravidelnost."}
                      </p>
                    </div>
                    <button
                      className="text-button"
                      onClick={() => navigate("progress")}
                    >
                      Můj pokrok <ArrowRight size={17} />
                    </button>
                  </section>
                </>
              )}
              {view === "topics" && (
                <>
                  <div className="page-heading">
                    <div>
                      <div className="eyebrow">VYBER SI SVOU SITUACI</div>
                      <h1>O čem si promluvíme?</h1>
                      <p>
                        10 témat, 50 krátkých dialogů. Začni tím, co je ti
                        blízké.
                      </p>
                    </div>
                  </div>
                  <div className="filters" aria-label="Úroveň">
                    {[
                      ["all", "Všechny úrovně"],
                      ["A2", "A2 · Základy"],
                      ["B1", "B1 · Středně pokročilí"],
                      ["B2", "B2 · Pokročilí"],
                    ].map(([id, label]) => (
                      <button
                        key={id}
                        aria-pressed={filter === id}
                        className={filter === id ? "selected" : ""}
                        onClick={() => setFilter(id)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <div className="topic-grid">
                    {topics
                      .filter((t) => filter === "all" || t.level === filter)
                      .map((t) => (
                        <TopicCard
                          key={t.id}
                          topic={t}
                          progress={progress}
                          onClick={() => openTopic(t)}
                        />
                      ))}
                  </div>
                </>
              )}
              {view === "detail" && (
                <>
                  <button
                    className="text-button"
                    onClick={() => navigate("topics")}
                  >
                    ← Všechna témata
                  </button>
                  <div className="detail-hero">
                    <span className={`topic-icon ${selected.color}`}>
                      {(() => {
                        const Icon = icons[selected.icon];
                        return <Icon size={28} />;
                      })()}
                    </span>
                    <span className="level">{selected.level}</span>
                    <h1>{selected.title}</h1>
                    <p>{selected.description}</p>
                    <div className="detail-meta">
                      <span>
                        <BookOpen size={16} /> 5 dialogů
                      </span>
                      <span>
                        <Clock3 size={16} /> 8–12 minut
                      </span>
                      <span>
                        {
                          selected.dialogs.filter(
                            (d) => progress[d.id]?.completed,
                          ).length
                        }{" "}
                        dokončeno
                      </span>
                    </div>
                    <button
                      className="button primary"
                      onClick={() =>
                        start(
                          selected,
                          Math.max(
                            0,
                            selected.dialogs.findIndex(
                              (d) => !progress[d.id]?.completed,
                            ),
                          ),
                        )
                      }
                    >
                      <Play size={18} /> Začít lekci
                    </button>
                  </div>
                  <h2 className="list-heading">Tvoje rozhovory</h2>
                  <div className="dialog-list">
                    {selected.dialogs.map((d, i) => (
                      <button key={d.id} onClick={() => start(selected, i)}>
                        <span
                          className={`dialog-number ${progress[d.id]?.completed ? "done" : ""}`}
                        >
                          {progress[d.id]?.completed ? (
                            <Check size={19} />
                          ) : (
                            String(i + 1).padStart(2, "0")
                          )}
                        </span>
                        <span>
                          <strong lang="en">{d.question}</strong>
                          <small>{d.translation}</small>
                        </span>
                        <span className="dialog-score">
                          {progress[d.id]?.bestScore != null
                            ? `${progress[d.id].bestScore} %`
                            : ""}
                        </span>
                        <ChevronRight size={19} />
                      </button>
                    ))}
                  </div>
                </>
              )}
              {view === "lesson" && (
                <Lesson
                  key={selected.dialogs[index].id}
                  dialog={selected.dialogs[index]}
                  index={index}
                  total={selected.dialogs.length}
                  title={selected.title}
                  settings={settings}
                  onBack={() => navigate("detail")}
                  onComplete={saveAttempt}
                />
              )}
              {view === "progress" && (
                <>
                  <div className="page-heading">
                    <div>
                      <div className="eyebrow">KAŽDÝ POKUS JE KROK VPŘED</div>
                      <h1>Tvůj pokrok</h1>
                      <p>Malé rozhovory, které postupně mění velké věci.</p>
                    </div>
                  </div>
                  <div className="stats-grid">
                    {[
                      ["Dokončené dialogy", `${completed} / 50`],
                      ["Uložené pokusy", String(attempts)],
                      [
                        "Průměr nejlepší shody",
                        average === null ? "—" : `${average} %`,
                      ],
                      [
                        "Poslední aktivita",
                        latest
                          ? new Date(latest[1].lastActivity).toLocaleDateString(
                              "cs-CZ",
                            )
                          : "Ještě tě čeká",
                      ],
                    ].map(([label, value]) => (
                      <div key={label} className="stat">
                        <span>{label}</span>
                        <strong>{value}</strong>
                      </div>
                    ))}
                  </div>
                  <p className="helper">
                    Skóre vyjadřuje shodu přepisu se vzorem, nikoli kvalitu
                    výslovnosti. Pokusy bez přepisu nejsou v průměru.
                  </p>
                  {!completed && (
                    <div className="empty-state">
                      <AudioLines size={36} />
                      <h2>Tady začíná tvůj příběh.</h2>
                      <p>
                        Dokonči první dialog a svůj pokrok uvidíš právě tady.
                      </p>
                      <button
                        className="button primary"
                        onClick={() => navigate("topics")}
                      >
                        Vybrat téma <ArrowRight size={17} />
                      </button>
                    </div>
                  )}
                  <div className="progress-list">
                    {topics.map((t) => {
                      const count = t.dialogs.filter(
                        (d) => progress[d.id]?.completed,
                      ).length;
                      return (
                        <button key={t.id} onClick={() => openTopic(t)}>
                          <div>
                            <strong>{t.title}</strong>
                            <span>{count} / 5</span>
                          </div>
                          <div className="progress-track">
                            <span style={{ width: `${count * 20}%` }} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
              {view === "settings" && (
                <SettingsPanel settings={settings} onChange={updateSettings} />
              )}
            </>
          )}
          <footer>
            <span className="footer-brand">talkie.</span>
            <span>Trochu praxe. O kus blíž k sobě.</span>
            <span>Made for your real voice.</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
function SettingsPanel({
  settings,
  onChange,
}: {
  settings: Settings;
  onChange: (settings: Settings) => void;
}) {
  const audio = useAudio(settings);
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">TAK, JAK TI TO VYHOVUJE</div>
          <h1>Tvoje tempo. Tvůj prostor.</h1>
          <p>Přizpůsob si poslech a doporučenou úroveň.</p>
        </div>
      </div>
      <section className="settings-panel">
        <label>
          Anglický hlas
          <select
            value={settings.voice}
            onChange={(e) => onChange({ ...settings, voice: e.target.value })}
          >
            <option value="">Výchozí anglický hlas</option>
            {audio.voices.map((v) => (
              <option key={v.voiceURI} value={v.voiceURI}>
                {v.name} · {v.lang}
              </option>
            ))}
          </select>
        </label>
        <p className="helper">
          Nabídka hlasů závisí na prohlížeči a operačním systému.
        </p>
        <label>
          Rychlost poslechu
          <select
            value={settings.rate}
            onChange={(e) =>
              onChange({ ...settings, rate: Number(e.target.value) })
            }
          >
            <option value="0.75">0,75× · Pomaleji</option>
            <option value="1">1× · Přirozeně</option>
            <option value="1.15">1,15× · Svižněji</option>
          </select>
        </label>
        <label>
          Moje úroveň
          <select
            value={settings.difficulty}
            onChange={(e) =>
              onChange({ ...settings, difficulty: e.target.value as Level })
            }
          >
            <option value="A2">A2 · Základy</option>
            <option value="B1">B1 · Středně pokročilí</option>
            <option value="B2">B2 · Pokročilí</option>
          </select>
        </label>
        <p className="helper">
          Úroveň určuje první doporučené téma na úvodní stránce. Všechna témata
          zůstávají dostupná.
        </p>
        <button
          className="button primary"
          disabled={!audio.speechAvailable}
          onClick={() =>
            audio.playing
              ? audio.stopSpeech()
              : void audio.speak([
                  "A little practice every day makes a difference.",
                ])
          }
        >
          <Play size={17} />
          {audio.playing ? "Zastavit ukázku" : "Poslechnout ukázku"}
        </button>
        {audio.error && (
          <p role="alert" className="notice">
            {audio.error}
          </p>
        )}
        <div className="divider" />
        <h2>Tvůj hlas patří tobě.</h2>
        <p className="muted">
          Nahrávky uchováváme jen v paměti této stránky. Po opuštění lekce se
          odstraní. Pokrok a nastavení zůstávají v tomto prohlížeči. Volitelný
          přepis zapneš samostatně přímo v lekci.
        </p>
      </section>
    </>
  );
}
