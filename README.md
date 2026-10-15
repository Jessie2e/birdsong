# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.

## Nearby birds in the local preview

The Vite development server now serves `/api/location-search` and `/api/nearby-birds`. Search a city (optionally with state/country) or a five-digit US ZIP, select a place, and fetch recent eBird observations. Refresh and radius changes reuse that place without asking for browser location.

For live reports, set `EBIRD_API_KEY` in `.env.local` and restart the dev server. The key stays on the server. Without it, place search still works and the UI offers **Try sample birds · local preview**. This development-only mode uses a fixed sample flock, explicitly labeled as sample data, with no fabricated sightings or dates. Nearby practice remains separate from flight accuracy/unlocks. Production uses the same handlers in `api/` and requires its own server environment key.

City/ZIP geocoding uses Open-Meteo with GeoNames attribution. Its free endpoint is for noncommercial use; review provider terms or use a licensed endpoint before commercial launch. https://open-meteo.com/en/docs/geocoding-api

## Your own bird calls

In the local **Listen outside** prototype, record or upload a clip, tap **Find birds**, and open a bird portrait. Confirm the match, choose **Keep this call**, trim and preview the excerpt, then confirm that the bird is audible in the excerpt. Saving retains the trimmed WAV locally; the original unsaved recording remains temporary. Enable **Use in my flights** to mix this call into up to three questions per flight once that species is unlocked. **My saved calls** on Home lets you replay, opt out or delete clips. Browser data clearing removes these local saves.

Homepage adventures now focus the next flight on a learning goal. Recognizing a catalog bird opens its reference voice in Studio; the original Robin/Wren phrase challenge reward remains available. Personal recordings can supply opted-in flight questions and Studio samples.

## Birdsong hub and shared collection

Home now offers Explore, Play & Learn, Make Music and Your Nest with equal prominence. Learning stats and focused adventures live inside Play & Learn. The home resume shortcut remembers the last area visited.

Eight starter birds remain available and existing collections are preserved. A successful 80% flight still welcomes the next bird. Four one-time milestones also welcome the next bird in the same unlock order: a first 20-character field note, a saved arrangement with three distinct enabled phrases after a full loop, a 5/6 Studio phrase challenge, and companion activities on three distinct local dates (no consecutive-day requirement). Welcomed birds are usable in Studio and as companions; voice recognition is a separate flight-earned card mark. The shared reward ledger (`birdsong-world-milestones-v1`) prevents repeatedly claiming the same milestone and recovers awarded birds if the older flock key is absent.

Your Nest includes paginated collection cards, a selectable/named companion, three habitats, manual call playback and a short quiet visit. Daily food, rest, freshness and movement meters reward care without decay or absence penalties. Field notes and companion care are saved locally. There are no accounts or card trading, and the oracle offers original playful reflections. Outdoor recognition is available as a hosted noncommercial beta.

## Music stations and phrase safety

Make Music now opens a station chooser: DJ station, Phrase workshop, My saved songs and Bird Memory. The phrase workshop independently selects a welcomed catalog recording, a saved call/phrase, or an imported audio file (up to 20 MB / 120 seconds). Reference recordings can be longer; selected source excerpts are limited to 0.5–30 seconds. Preview and save a named WAV with trim, volume (0–200%) and pitch (±12 semitones). Pitch also changes speed. Source attribution follows edited copies.

All phrases use the existing local IndexedDB recording store with `kind: 'phrase'`. Pitch edits set a permanent `pitchEdited` flag, inherited by copies even when a later edit has zero pitch. Pitch-edited phrases are music-only: the save path and flight planner independently reject them as learning audio. Unpitched phrases require an assigned bird, explicit excerpt confirmation and a separate flight opt-in; the bird must also be welcomed before it can appear in flights. Saved music recipes refer to stable source IDs, not temporary blob URLs. Missing sources are muted when reopening a song. DJ lanes accept original birds, saved calls and phrases; long sounds are faded/cut to the eight-beat loop duration to avoid stacked overlapping copies.

Bird Memory uses four familiar voices, one added note per round, visible highlights, manual start/stop/replay, and a locally saved best score. Its scores stay separate from species-learning accuracy and shared collection rewards. Explore icons, bird-art centering, a full-content-width learning journey, an explanatory flight card, and companion audio stopping are also included in this update.

### Visual phrase trimming

The phrase workshop includes an interactive waveform: drag IN/OUT handles to resize, drag the shaded phrase to move it while keeping its duration, or click another point to place it there. A whole-recording overview pans the detail view; zoom, Fit phrase, Whole recording and Earlier/Later controls support longer sources. Exact numeric times and keyboard arrows (0.01s, or 0.1s with Shift) are available. Peaks include every channel/sample so brief transients are retained. Wave height boosts only the display. Preview playhead positions map back to source time, including pitch-induced speed changes. Edits remain non-destructive until a separate phrase is saved; learning/pitch eligibility is unchanged.

## Your Nest and oracle audio

Pip uses only welcomed species, with two free species changes per local day and extra tokens earned once daily from a 5/6 advanced listening result or five Sky time dodges. Care bonds reveal existing species facts, mnemonics and habitat information. Recognize two birds in flights to enter advanced listening; accuracy in both excerpt modes earns a permanent Mastered by ear mark.

The oracle has separate readings: companion playback sequences three 1.8-second excerpts in drawn-card order and highlights each active card; human read-aloud uses device speech at rate 1.05. Excerpts select high-energy sections of the credited originals, include surrounding sound, and are not isolated chirps. Stop, new draws, changing tabs and leaving Your Nest cancel playback.

## Sharing

The established production address is https://birdsong-iota.vercel.app, connected to Jessie2e/birdsong on main. The production build includes the hub, learning, music, Your Nest and server handlers in api/. Listen outside is available as a free noncommercial beta. Unmodified BirdNET assets are hosted in public/birdnet with attribution, full license and source checksums. Keep .birdnet-local and secrets out of Git. Live eBird results require EBIRD_API_KEY configured on the host. Progress, phrases and recordings are browser-local and do not sync between devices or domains.

Hosted listening downloads the ~57 MB kit only on request. Recording and inference stay in the browser. Worker WebGL falls back to CPU when unavailable; short clips are recommended on slower phones. No automatic microphone access or audio uploads are introduced. A physical iPhone/Android microphone test is still required.

## Mobile polish and audio storage

Audio saves now serialize WAV Blob/File data to ArrayBuffer bytes before opening the IndexedDB write transaction, avoiding mobile WebKit Blob persistence errors. Reads recreate audio Blobs and still support existing Blob records without clearing saved calls. Credits, pitch history and learning opt-in remain intact. Music phrases can be 0.05–30 seconds; snippets below 0.5 seconds are music-only, with the storage writer and flight planner enforcing that rule.

The hub starts with Play & Learn and includes gently moving decorative clouds (static with reduced motion). Collection copy uses Flock and the companion is Bird Bestie; persisted keys stay compatible. Field guide defaults to All birds, explains Still learning/ear/eye marks, returns to Explore and lets mobile back faces grow to fit content. DJ transport stays above compact collapsible lanes, with species colors matching lane badges and entry beats. Memory uses high-energy snippets and a visible/audible miss cue. Sky time includes low ground obstacles.
