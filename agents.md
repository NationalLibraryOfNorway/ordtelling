# AI Multi-Agent Protocol for Tell-Korpus PWA

Dette dokumentet definerer reglene for hvordan ulike AI-assistenter (for eksempel GitHub Copilot, ChatGPT, Antigravity, Claude) skal samarbeide om denne kodebasen. 

Siden AI-agenter mangler delt minne og byttes ut på tvers av verktøy, fungerer dette dokumentet (sammen med `CHANGELOG_AI.md` og `manifest.md`) som den sentrale, stabile kommunikasjonsflaten.

## 🤖 Obligatoriske Regler for Alle AI-Agenter
Når du som en AI-assistent starter en ny oppgave eller økt i dette prosjektet, MÅ du følge denne protokollen:

1. **Les alltid disse filene først (Før du skriver kode):**
   - `manifest.md` for å forstå arkitekturen og kravene.
   - `CHANGELOG_AI.md` for å se hva forrige agent gjorde sist.

2. **Hold deg til eksisterende arkitektur:**
   - Prosjektet er en Frontend-only PWA (Vite + React + Tailwind). **Ingen backend** skal bygges. 
   - Hold koden i funksjonelle React-komponenter, og plasser all hjelpelogikk i `src/utils/`.

3. **Dokumentér alltid arbeidet ditt:**
   - Før du avslutter økten (eller før du pusher koden), MÅ du oppdatere `CHANGELOG_AI.md`.
   - Skriv inn dagens dato, hvem du er (eks. "ChatGPT-4o" eller "Copilot"), og en punktliste over funksjonaliteten du implementerte, fikset eller modifiserte. Dette sikrer at neste agent vet nøyaktig hva som er gjort.

## Arkitektur & Ansvarsområder
Koden er delt opp i følgende kjerneområder. Hvis du skal jobbe med en spesifikk feature, finn riktig fil:

- **UI & Skjemaer:** `src/App.jsx` og `src/components/ActionForms.jsx`.
- **Visning av Data (Tabell/Pivot):** `src/components/ResultsView.jsx` og `src/utils/pivot.js`.
- **Parsing (Excel/CSV):** `src/components/FileUploader.jsx` og `src/utils/fileParser.js`.
- **Nettverk mot DH-lab API:** `src/utils/dhlabApi.js`.

---
*Kjære AI: Takk for at du følger protokollen. Legg gjerne til egne punkter her hvis du oppdager mønstre eller regler som vil gjøre det enklere for fremtidige agenter å forstå kodebasen.*
