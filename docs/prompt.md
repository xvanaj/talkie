Vytvoř moderní responzivní webovou aplikaci pro procvičování anglické výslovnosti metodou language shadowing.

Nejdříve prozkoumej existující repository a použij jeho současný stack a konvence. Pokud je projekt prázdný, vytvoř aplikaci pomocí Next.js, Reactu, TypeScriptu a Tailwind CSS. Aplikace musí fungovat lokálně po běžném `npm install` a `npm run dev`.

## Cíl aplikace

Uživatel si vybere tematický kurz a procvičuje krátké realistické dialogy. Aplikace přehraje otázku i vzorovou odpověď, uživatel odpověď opakuje, nahraje svůj hlas a následně dostane srozumitelnou zpětnou vazbu.

Nejde o klasický slovníkový dril. Hlavní důraz je na přirozenou mluvenou angličtinu, rytmus, přízvuk, intonaci a celé užitečné fráze.

Rozhraní aplikace bude v češtině, procvičované věty budou v angličtině.

## Tematické kurzy

Připrav alespoň tyto kategorie:

* Business Casual English
* pracovní schůzky
* small talk s kolegy
* prezentace a vysvětlování nápadů
* zdvořilý nesouhlas
* status update projektu
* pracovní pohovor
* cestování
* restaurace a běžné situace
* neformální konverzace

Každé téma musí obsahovat nejméně pět krátkých dialogů. Data ulož odděleně od komponent tak, aby bylo snadné přidávat další témata.

Příklad dialogu pro Business Casual English:

Question:
“Hey, how’s the project coming along?”

Model answer:
“It’s going pretty well. We’re slightly behind schedule, but we should catch up by Friday.”

Alternative answers:

* “It’s moving along nicely. We just need to finish a few details.”
* “We’ve run into a small delay, but nothing too serious.”

Czech explanation:
Neformální, ale stále profesionální způsob podání stručného pracovního statusu.

## Průběh lekce

Jedna lekce bude mít následující kroky:

1. Poslech otázky.
2. Zobrazení otázky a jejího českého významu.
3. Poslech vzorové odpovědi.
4. Režim „Poslouchej a opakuj“, ve kterém lze odpověď přehrát:

    * normální rychlostí,
    * rychlostí 0,75×,
    * po jednotlivých částech.
5. Nahrání odpovědi uživatele přes mikrofon.
6. Možnost přehrát vlastní nahrávku.
7. Přepis řeči na text, pokud jej prohlížeč podporuje.
8. Porovnání přepisu se vzorovou větou.
9. Zobrazení problematických nebo vynechaných slov.
10. Možnost pokus zopakovat nebo pokračovat dál.

Přidej také skutečný „Shadow mode“, ve kterém se věta přehrává po krátkých úsecích a aplikace mezi nimi nechává prostor pro zopakování.

## Hodnocení

Zobraz samostatně:

* přesnost slov,
* plynulost,
* dokončení věty,
* celkové skóre.

Pokud aplikace používá pouze browser Speech Recognition, označ výsledek jako „shoda přepisu“, nikoliv jako přesné hodnocení výslovnosti. Nevydávej textovou shodu za fonetickou analýzu.

Architekturu připrav tak, aby bylo později možné připojit API poskytující detailní hodnocení výslovnosti po jednotlivých slovech či fonémech. Pro tuto integraci vytvoř samostatné rozhraní nebo service vrstvu.

## Technologie zvuku

Pro přehrávání vzorových vět použij Web Speech API `speechSynthesis`, pokud není k dispozici dodané audio.

Pro nahrávání použij `MediaRecorder`.

Pro přepis použij browser Speech Recognition tam, kde je dostupný. Pokud podporovaný není, aplikace musí dál umožnit nahrání a přehrání hlasu a zobrazit přátelské vysvětlení omezení.

Vyžádání oprávnění k mikrofonu proveď až po kliknutí uživatele. Zobraz jasný stav nahrávání a možnost nahrávání zrušit. Nahrávky bez výslovného souhlasu nikam neodesílej.

## Obrazovky

Vytvoř:

* úvodní stránku s krátkým vysvětlením shadowingu,
* přehled témat a úrovní,
* detail tématu,
* samotnou lekci,
* stránku pokroku,
* nastavení hlasu, rychlosti přehrávání a obtížnosti.

Pokrok ukládej lokálně do `localStorage`. Sleduj dokončené dialogy, nejlepší skóre, počet pokusů a poslední aktivitu.

## Design

Použij čistý, klidný a profesionální vizuální styl. Aplikace nemá působit dětsky ani jako generická administrace.

Hlavní výuková obrazovka má soustředit pozornost na jednu větu. Použij velkou typografii, dostatek prostoru a výrazná tlačítka pro:

* přehrání,
* zpomalený poslech,
* nahrávání,
* vlastní přehrávku,
* nový pokus,
* pokračování.

Zajisti dobrou použitelnost na mobilu i desktopu, ovládání klávesnicí, viditelný focus, dostatečný kontrast a respektování `prefers-reduced-motion`.

## Kvalita implementace

* Použij znovupoužitelné komponenty a jasné TypeScript typy.
* Nedávej obsah lekcí přímo do JSX.
* Ošetři odmítnutí mikrofonu i nepodporované browser API.
* Nepoužívej falešná tlačítka ani funkce, které pouze vypadají aktivně.
* Přidej několik smysluplných testů nejdůležitější logiky, zejména výpočtu textové shody a ukládání pokroku.
* Přidej stručné README s instalací, spuštěním, omezeními browserových API a popisem budoucí integrace skutečného pronunciation-scoring API.
* Po implementaci spusť lint, TypeScript kontrolu a testy a oprav nalezené chyby.

Výsledkem musí být funkční MVP, nikoliv pouze statický designový prototyp.
