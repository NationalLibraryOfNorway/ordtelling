# Agents and Workflow for Tell-Korpus PWA

Dette dokumentet definerer ansvarsområdene (eller "agent-rollene") for AI-assistenten i utviklingen av denne PWA-en.

Når man bygger appen fra bunnen, bør arbeidet deles opp i følgende faser og ansvarsområder:

## 1. Oppsett og Struktur (Boilerplate Agent)
- **Ansvar:** Etablere Vite-prosjekt (React/JS), installere avhengigheter (f.eks. Tailwind, XLSX/PapaParse). Sette opp manifest og Service Worker for PWA.
- **Output:** Et kjørbart "Hello World" grensesnitt.

## 2. Datahåndtering (Data & Parsing Agent)
- **Ansvar:** Lage funksjonalitet for å laste opp CSV- eller Excel-filer direkte i nettleseren (ingen backend).
- **Krav:** 
  - Verifiser at kolonnene `urn` og `dhlabid` eksisterer.
  - Sørge for at appens state holder på disse verdiene.
  - Integrere funksjonalitet for "sampling" av store korpus (over 2000 URN-er) dersom bruker ønsker et frekvensoppslag på "alle ord".

## 3. DH-Lab API Integrasjon (Network Agent)
- **Ansvar:** Skrive asynkrone JavaScript-funksjoner for oppslag mot `https://api.nb.no/dhlab/frequencies`.
- **Krav:** 
  - Støtte to modi: `Alle ord` (tom liste med ord) og `Ordliste` (liste med ord oppgitt fra grensesnittet).
  - Konstruere POST-forespørsler der `urn` fra korpuset brukes for oppslag.
  - Håndtere at API-et returnerer en respons knyttet mot `dhlabid`, og slå dette sammen med korpus-metadaten lest inn fra start.
  - Implementere batching for ordlistesøk der korpuset er veldig stort.

## 4. Visualisering og Eksport (UI/UX Agent)
- **Ansvar:** Vise resultatet i grensesnittet (for eksempel i en datatabell eller aggregerte grafer).
- **Krav:**
  - Enkel og rask respons i grensesnittet.
  - Funksjonalitet for å laste ned det ferdige telle-resultatet som ny CSV/Excel-fil slik at forskeren kan analysere dataen videre.

---
**Instruksjoner til videre arbeid:** Start med å utføre rollen til *Oppsett og Struktur*, og beveg deg gradvis nedover i listen. Hver agent/steg bør kvalitetssikres før man går videre.
