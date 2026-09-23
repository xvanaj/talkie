# Talkie

[![CI](https://github.com/xvanaj/talkie/actions/workflows/ci.yml/badge.svg)](https://github.com/xvanaj/talkie/actions/workflows/ci.yml)

**Aplikace online:** https://xvanaj.github.io/talkie/

Responzivní české MVP pro procvičování angličtiny metodou shadowing. Obsahuje 10 témat a 50 dialogů, přehrávání po úsecích, nahrávání, volitelný přepis, srovnání textu a lokální pokrok. Původní Java/Gradle soubory jsou zachovány; web je samostatná Next.js aplikace v kořeni projektu.

## Spuštění

Potřebuješ Node.js 22.13+ a npm (kontroly prošly i na místním Node.js 22.11; některé lint závislosti vyžadují novější patch).

```sh
npm install
npm run dev
```

Otevři http://localhost:3000. Žádný API klíč ani databáze nejsou potřeba.

```sh
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
npm start
```

## GitHub Actions

Workflow `.github/workflows/ci.yml` běží při pushi do `master`, při pull requestu do `master` a ručně přes **Actions → CI → Run workflow**. Na Ubuntu s Node.js 22 provede `npm ci`, lint, TypeScript kontrolu, jednotkové testy a produkční build. Playwright potom otestuje produkční server v Chromiu; prohlížeč i systémové závislosti se instalují automaticky. Lokálně se dál používá Edge a vývojový server.

HTML report, screenshoty a trasování neúspěšných testů jsou dostupné jako artefakt `playwright-report` po dobu 7 dnů. Kontrolní job má pouze právo číst repozitář. Novější běh ruší předchozí běh stejné větve.

Po úspěšných kontrolách vznikne také statický export pro GitHub Pages (`PAGES_EXPORT=true`). Při pushi nebo ručním spuštění na `master` se export automaticky nasadí na https://xvanaj.github.io/talkie/. Pull requesty export ověří, ale nenasazují. Samostatný deploy job používá prostředí `github-pages`, oprávnění `pages: write` a `id-token: write`; vlastní secrets nejsou potřeba.

`next.config.ts` zapíná pouze pro Pages export `output: "export"` a prefix `/talkie`. Lokální `npm run dev`, běžný build a `npm start` dál fungují bez prefixu. HTTPS na Pages umožňuje používat mikrofon. Hosting je statický: budoucí serverové pronunciation API bude vyžadovat samostatný backend nebo přechod na hosting s podporou Next.js serveru. Pokrok z localhostu se na novou doménu automaticky nepřenáší.

## Použití a soukromí

Vyber téma a dialog, poslechni si otázku a vzorovou odpověď. Shadow mode přehrává úseky s mezerou pro opakování; jednotlivé části lze přehrát i ručně. Nahraj vlastní odpověď, zastav nahrávání, poslechni si ji a případně porovnej přepis. „Uložit a pokračovat“ započítá jeden pokus a dokončení. Nový pokus před pokračováním původní neuloženou nahrávku nahradí. Bez přepisu je dokončení uloženo bez skóre.

- Mikrofon se žádá pouze po kliknutí a vyžaduje localhost nebo HTTPS. Nahrávání trvá nejvýše 60 sekund. Při zrušení či opuštění lekce se mikrofon uvolní a nahrávka zahodí.
- `MediaRecorder` uchovává nahrávku pouze v paměti stránky, ne v localStorage ani na serveru aplikace.
- Přepis přes `SpeechRecognition` je volitelný a ve výchozím stavu vypnutý. Jeho dostupnost závisí na prohlížeči; bez něj fungují nahrávání i přehrávání. Prohlížeč může zvuk odesílat provozovateli své rozpoznávací služby, proto se souhlas vyžaduje zvlášť v lekci. Viz [MDN SpeechRecognition](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition).
- Hlasy `speechSynthesis` závisejí na systému. Některé mohou používat síťovou službu pro syntézu dodaného textu. Neodesílají jí uživatelskou nahrávku. Výběr a rychlost jsou v nastavení.
- Pokrok a nastavení se ukládají pod verzovanými klíči `talkie.progress.v1` a `talkie.settings.v1`. Soukromý režim či blokované úložiště mohou zabránit zachování dat. Data se mezi zařízeními nesynchronizují.

## Hodnocení a rozšíření

`src/lib/scoring.ts` provádí Levenshteinovo zarovnání slov: zohlední vynechání, záměny, opakování a slova navíc. Ignoruje interpunkci, velikost písmen a tvar apostrofu. Přesnost je počet shod / maximum délky vzoru a přepisu. Dokončení je podíl obsazených pozic ve vzoru včetně záměn. Celkové skóre odpovídá přesnosti. Kontrakce nejsou rozepisovány a legitimní alternativní odpověď nemusí odpovídat vzoru. Chyby rozpoznávání ovlivňují výsledek.

Výsledek je **shoda přepisu**, ne fonetická analýza. Plynulost není z textu měřitelná a zobrazuje se „—“.

`PronunciationService` v `src/lib/types.ts` odděluje hodnocení od UI. Budoucí poskytovatel implementuje `assess({ reference, transcript, audio })`, vrátí `Assessment` se zdrojem `pronunciation` a bude moci rozšířit datový model o fonémy a časování. Pro API přidej serverovou Next.js route s tajným klíčem v prostředí, limity uploadu, ošetřením chyb a samostatným výslovným souhlasem s odesláním nahrávky. Současné MVP žádný scoring endpoint nevolá; UI popisky bude potřeba přizpůsobit skutečně poskytovaným metrikám.

Obsah je oddělený v `src/data/topics.ts`; dialog má stabilní ID, překlad otázky, odpověď, alternativu, vysvětlení a ručně členěné úseky. Přidání dialogu nevyžaduje změnu komponent lekce. Úroveň v nastavení určuje doporučené první téma, filtry zpřístupňují všechny úrovně.

## Ověření v prohlížeči

Jednotkové testy ověřují obsah, zarovnání textu a obnovu/aktualizaci pokroku. Prohlížečové testy v Playwrightu používají nainstalovaný Microsoft Edge (kanál lze změnit v `playwright.config.ts`). Ověřují mobilní rozložení, filtry, ukládání nastavení, odmítnutý mikrofon a skutečný MediaRecorder se syntetickým lokálním audio streamem. Vývojový server se spouští automaticky.

Skutečný mikrofon a systémové hlasy vyžadují ruční kontrolu: povolit i zamítnout mikrofon, nahrát/přehrát/zrušit pokus, odejít během nahrávání, zastavit shadow mode během pauzy, porovnat přepis se souhlasem a vyzkoušet prohlížeč bez SpeechRecognition. Rozhraní používá nativní tlačítka, formuláře a audio ovladače, viditelný focus a respektuje omezení pohybu.
