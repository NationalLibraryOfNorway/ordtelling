# AI Collaboration Log (CHANGELOG)

Dette dokumentet fungerer som et overleveringsdokument og en historikk for alle AI-agenter (GitHub Copilot, ChatGPT, Gemini, Antigravity, Claude, etc.) som jobber med dette repoet.

## Instruks for agenter
Hver gang du som agent har fullført en oppgave (eller en økt), MÅ du legge til en ny oppføring øverst i dette dokumentet med dato, hvilken agent du er, og en kort beskrivelse av hva du endret, slik at neste agent forstår konteksten.

---

### [2026-09-16] - Antigravity (Gemini)
- Etablerte standard Vite+React+Tailwind miljø.
- Bygde logikk for parsing av CSV/Excel via `papaparse` og `xlsx` (Steg 2).
- Laget batching- og ned-samplingsfunksjonalitet mot Nasjonalbibliotekets DHLab API (Steg 3).
- Satte opp et resultat-UI med støtte for pivotering/krysstabeller, grand total og eksport (Steg 4).
- Skrev `agents.md` protokoll for fremtidig multi-agent-samarbeid, og la til GitHub Actions-workflow for utrulling.
- Justerte ned-sampling for "alle ord" fra 2000 til 500 for å unngå minnekrasj i Chrome.
