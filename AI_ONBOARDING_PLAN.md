# AI Onboarding Assistant - Implementační Dokumentace

Tento dokument slouží jako technická specifikace a plán pro nahrazení statického Onboarding Wizardu za konverzačního AI Asistenta.

## 1. Koncept
Cílem je vytvořit "virtuálního marketingového konzultanta", který povede s uživatelem rozhovor. Místo vyplňování dlouhého formuláře bude uživatel odpovídat na otázky. AI bude inteligentně extrahovat informace (Slot Filling) z konverzace a jakmile nasbírá dostatek dat pro vytvoření marketingové strategie, proces automaticky ukončí a spustí generování (scraping, analýza atd.).

### Hlavní výhody
- **Flexibilita**: AI může klást doplňující otázky, pokud je odpověď nejasná.
- **Uživatelská přívětivost**: Působí to jako služba na míru, ne jako administrativní úkon.
- **Kvalita dat**: AI může ihned validovat vstupy (např. "To zní jako velmi nízký rozpočet pro tento typ kampaně, jste si jistí?").

---

## 2. Architektura Dat (State Management)

AI musí během konverzace udržovat "stav" (State) - tedy to, co už víme a co ještě chybí.

### Cílový JSON Objekt (The Target State)
Toto jsou data, která musí AI "vytěžit" z konverzace:

```typescript
interface OnboardingState {
  // Základní profily
  companyName: string | null;
  industry: string | null;      // Pokud uživatel řekne "prodávám boty", AI doplní "E-commerce"
  productDescription: string | null; // Co prodává/dělá
  
  // Klíčové metriky
  targetInvestAmount: number | null; // Budget
  yearsOfExperience: number | null;
  
  // Marketingová specifika
  usp: string | null;           // Unikátní prodejní argument
  targetAudience: string | null; // Kdo je zákazník (B2B/B2C, demografie)
  goal: string | null;          // Čeho chtějí dosáhnout (Leady, Prodeje, Brand)
  
  // Tone of Voice
  communicationStyle: string | null; // Formální, přátelský, drsný...
  
  // Meta
  isFinished: boolean; // Flag, který AI nastaví na true, až bude mít vše
  missingInfo: string[]; // Seznam věcí, na které se AI ještě musí doptat
}
```

---

## 3. Backend Implementace (`backend/`)

### 3.1 Nový Endpoint
Bude potřeba vytvořit nový endpoint pro chatování.

- **Route**: `POST /api/ai/chat-onboarding`
- **Body**:
  ```json
  {
    "message": "Prodávám dřevěné hračky a chci zvýšit prodeje před Vánoci.",
    "currentProfileState": { ... } // Aktuální stav, co už jsme zjistili
    "history": [ ... ] // Historie chatu pro kontext
  }
  ```
- **Response**:
  ```json
  {
    "aiResponse": "Skvělé! Dřevěné hračky jsou výborný segment. Jaký máte na kampaň zhruba rozpočet a cílíte spíše na rodiče malých dětí, nebo sběratele?",
    "updatedProfileState": { ... }, // Aktualizovaný stav (doplní se industry, goal...)
    "isComplete": false
  }
  ```

### 3.2 AI Service Logic (`services/aiService.js`)
Logika bude využívat OpenAI (GPT-4o nebo GPT-3.5-turbo) s funkcí **Structured Outputs** nebo **Function Calling**. 

**System Prompt (Draft):**
> Jsi zkušený marketingový stratég z agentury Advertly. Tvým cílem je vést úvodní rozhovor s novým klientem, abys pochopil jeho byznys a mohl navrhnout strategii.
> 
> Tvůj úkol je dvojí:
> 1. Odpovědět klientovi přirozeně, empaticky a profesionálně.
> 2. Analyzovat jeho text a extrahovat klíčové údaje do JSON struktury.
>
> Musíš získat tyto informace: [Seznam povinných polí].
> Pokud něco chybí, zeptej se na to v dalším kroku. Neptej se na vše najednou, max 1-2 otázky naráz.
> Jakmile máš VŠECHNY povinné informace, nastav "isFinished": true.

---

## 4. Frontend Implementace (`advertly/`)

### 4.1 UI Komponenty
Vytvoříme nové rozhraní `ChatInterface.tsx`:
- **Chat Window**: Scrollující oblast se zprávami (Bubliny User vpravo, AI vlevo).
- **Input Area**: Textarea + Send button.
- **Progress Sidebar (Volitelné)**: vizuální checklist "Co už o vás víme", který se bude dynamicky odškrtávat, jak AI získává data. To dodává skvělý gamification efekt.

### 4.2 Logika (`useChatOnboarding` hook)
- Bude držet `messages` (pole zpráv).
- Bude držet `profileState` (aktuální nasbíraná data).
- Bude řešit odesílání na backend a loading stavy.
- Po přijetí `isComplete: true` provede přesměrování na existující `Loading/Analyzing` obrazovku, která spustí generování strategie.

---

## 5. Roadmapa Implementace

### Fáze 1: Backend Core (Den 1)
- [ ] Vytvořit definici TypeScript interfacu pro `OnboardingState`.
- [ ] Implementovat `chatOnboarding` funkci v `aiService.js` (napojení na OpenAI API).
- [ ] Vyladit System Prompt tak, aby správně extrahoval data a zároveň byl "lidský".
- [ ] Vytvořit API endpoint `POST /api/ai/chat-onboarding`.

### Fáze 2: Frontend Basic (Den 1-2)
- [ ] Vytvořit komponentu `ChatWizard.tsx`.
- [ ] Implementovat základní chatovací UI (bubliny, input).
- [ ] Napojit na backend API.
- [ ] Zobrazit "Thinking..." stavy.

### Fáze 3: Integrace a "Live" Feedback (Den 2-3)
- [ ] Vizualizace stavu: Přidat panel, který ukazuje, co už AI pochopila (např. "Obor: E-shop ✅", "Rozpočet: Zjišťuji... ⏳").
- [ ] Ošetření chyb (co když API selže?).
- [ ] Implementace logiky dokončení -> Přechod na `isAnalyzing` stav a zavolání existující `generateStrategy`.

### Fáze 4: Testování a Ladění (Den 3)
- [ ] Edge cases: Uživatel píše nesmysly, uživatel mění téma.
- [ ] Prompt Engineering: Ujistit se, že AI není otravná a neptá se dokola na to samé.
- [ ] Performance: Rychlost odezvy.

---

## 6. Další kroky (Future Improvements)
- **Hlasový vstup**: Možnost diktovat odpovědi (Whisper API).
- **Analýza webu předem**: Uživatel zadá jen URL, AI si web sama scrapne a předvyplní 80% informací, v chatu se pak jen doptá na detaily (budget, cíle), které na webu nejsou. *Toto doporučuji jako další velký upgrade.*
