# Manifest: Tell-Korpus PWA

## Mål og Kontekst
Vi bygger en Progressive Web App (PWA) som fungerer som et verktøy for å telle opp ord og ordfrekvenser i et definert korpus. Appen skal ta inn en korpus-fil (CSV eller Excel) lastet opp av brukeren, og utføre oppslag mot Nasjonalbibliotekets DH-lab API.

## Dataformat og Krav
- **Korpusfil:** Må inneholde kolonnene `urn` og `dhlabid`.
  - Årsak: Kall mot DH-lab sin `frequencies`-API tar inn URN-er, men returnerer data identifisert med `dhlabid`. Begge kolonner trengs derfor for å koble resultatene sikkert tilbake til metadata.

## Hovedfunksjonalitet
1. **Opplasting:** Brukeren laster inn en CSV- eller Excel-fil lokalt i nettleseren.
2. **Ord-telling:**
   - **Telle alle ord:** Appen ber om frekvenser for alle ord i dokumentene.
   - **Telle med ordliste:** Brukeren kan oppgi egne ordlister for målrettet søk.
3. **Skalerbarhet & Sampling:**
   - **Alle ord (tung spørring):** Dersom korpuset er veldig stort (f.eks. over 2 000 dokumenter), må appen implementere ned-sampling (random utvalg) for å unngå å overbelaste API/nettleser.
   - **Ordliste (lett spørring):** Dersom brukeren søker med en ordliste, tåler systemet nesten ubegrenset størrelse på korpuset, og kan behandle hele datasettet (eventuelt med en høy og trygg kutt/batching-mekanisme).
4. **API:** Vi bruker det samme API-et som ble brukt i `bbi_diversity` (for eksempel `https://api.nb.no/dhlab/frequencies`), som via en POST-request henter frekvensdataene basert på oppgitte URN-er (og eventuelle ordlister).

## Valgt Arkitektur
- **Frontend-only:** Utvikles med f.eks. Vite, React, og Tailwind CSS (eller ren HTML/JS om ønskelig). All prosessering skjer i nettleseren. PWA sørger for lokal cache/offline-muligheter for grensesnittet.
- **Fil-parsing:** Bruk av biblioteker som `xlsx` og/eller `PapaParse` for å lese inn data i nettleseren.

## Gjennomføringsplan / Tasks
1. Sett opp PWA-skjelett (boiler plate).
2. Lag UI for opplasting og validering av korpus (sjekk av `urn` og `dhlabid` kolonnene).
3. Implementer logikk for DH-lab API kall, inkludert støtte for batching / ned-sampling avhengig av søketype.
4. Vis frekvens-tabeller til bruker og la de laste ned det aggregerte resultatet.
