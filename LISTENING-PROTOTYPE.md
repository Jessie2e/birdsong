# Outdoor listening prototype

Run `npm run listening:setup` once, then `npm run dev`. Choose **Listen outside · Beta**, load the listening kit, and record or choose a 3–45 second clip. Tap **Find birds**, then play the recording to watch approximate detection highlights. Model and audio analysis stay on the device. The optional Alabama seasonal filter is described below. Physical microphone settings can strongly affect results.

After confirming a catalog bird, open its portrait and choose **Keep this call**. Preview a trimmed excerpt, explicitly confirm the bird in that excerpt, and save it. Only the trimmed WAV and its metadata are stored in IndexedDB (`birdsong-personal-recordings-v1`); unsaved captures remain temporary. Users can opt each saved call into regular flights, opt out, or delete it in **My saved calls**. Up to three eligible questions per flight can use personal audio; nearby quizzes and comparison challenges retain their references. Personal recordings cannot introduce locked species. Confirmed labels are user judgments, not model guarantees; trimming does not isolate species. Clearing browser/site data removes saved calls. Saves do not upload audio, precise location or metadata to a recognition service.

The listening entry remains a local development prototype. Catalog-specific personal saving does not support birds without a game entry.

## Attribution and distribution

Model assets: BirdNET browser model distributed at https://birdnet.cornell.edu/models/birdnet/model.json and its referenced weights; labels at https://birdnet.cornell.edu/models/birdnet/labels/en_us.txt. Assets are unmodified. Download script records their source. BirdNET is developed by the Cornell Lab of Ornithology and Chemnitz University of Technology. Published model terms: CC BY-NC-SA 4.0, https://github.com/birdnet-team/BirdNET-Analyzer#license . Citation: Kahl, S., Wood, C. M., Eibl, M., & Klinck, H. (2021), BirdNET: A deep learning solution for avian diversity monitoring. Ecological Informatics, 61, 101236.

This is a local educational experiment. No commercial permission has been requested or obtained. Commercial use needs appropriate permission or a different commercially licensed model. The model lives in ignored `.birdnet-local/` and is served only by Vite's development middleware. Normal production builds have no listening entry point and do not include the model. Do not enable commercial distribution without reviewing the specific model terms.

TensorFlow.js: Apache-2.0. Birdsong's FFT/custom layer implementation is independently written; it follows the input preprocessing requirements exposed by the distributed model and browser demo. No demo UI or worker source is bundled.

## Verification

Known hawk clip returned Red-shouldered Hawk as top match (99% peak model score). A second catalog clip returned Prothonotary Warbler and Northern Parula; BirdNET’s official demo returned the same species (its pooled scores differ from our peak scores). Do not infer field accuracy from these two recordings. Silence returned no matches; a one-second clip was rejected. Recording controls were exercised with a synthetic audio stream, which ended at the 15-second limit. Confirmation and targeted practice were checked on the isolated test origin. Phone, tablet and desktop layouts had no horizontal overflow. Physical microphones and field conditions remain untested.

## Playback flock

Recording playback now shows a normalized waveform and stable circular portraits. The worker retains species detections from three-second windows with a 1.5-second hop, plus a full tail window. All overlapping species can highlight together. Highlights follow audio currentTime, including seeking, and clear on pause/end. They are approximate detection spans, not isolated syllables or proof that every suggestion is correct. Unillustrated wildlife suggestions use a clearly generic musical portrait with their species name. No location filtering is applied. Tap a portrait to open a keyboard-accessible native dialog with confidence, comparison audio, confirmation and targeted practice. Reference audio pauses the recording; reduced-motion mode keeps highlights and disables bobbing. Additional recording controls collapse once results arrive. The waveform/timeline live only in memory with the recording; audio is not uploaded or saved to the heard list.

The looping bird-song studio and learning-based game unlocks are future ideas, not implemented in this playback update.

## Birdsong Studio first pass

Home → Birdsong Studio opens a four-voice mixer. Cardinal and Blue Jay are available immediately. A score of at least 5/6 in its phrase challenge opens Robin and Wren; existing recognition of both reward species also opens them. Studio answers do not alter flight accuracy, flight badges, or species unlocks. Only the chorus reward is persisted (`birdsong-studio-chorus-v1`). Mix settings and previews reset on leaving.

Each track plays a natural-speed excerpt of an existing, local G. McGrane public-domain recording; the source and trim notice appear in the studio. The editor supports a 0–12 second start, .5–4 second length and individual volume. Short fades avoid cut-edge clicks. These are reference-recording phrases, not isolated stems, automatic call-type labels, or independent recording variants. Audio separation and a larger annotated phrase catalog remain future work.

An eight-beat Web Audio schedule places voices every two beats at 80, 100 or 120 BPM. Optional synthesized percussion uses the same audio clock. There is no autoplay, microphone use or uploading. Stop, navigation and component cleanup cancel playing and pending audio. Reduced motion preserves the glow and removes bobbing.

Outdoor microphone recording now stops at 45 seconds, and uploaded clips support 3–45 seconds (a small allowance covers recorder timing overhead). Results appear beside playback. Discard clears the current in-memory recording and playback state; confirmed heard-list entries remain separate.

## Recognition diagnostics and regional filtering

Standard mode retains the 35% audio-score cutoff. Faint calls reveals candidates at 10% and explicitly labels them tentative; lowering the cutoff is not an accuracy improvement by itself. Absolute RMS/peak/clipping measurements are separate from the normalized waveform. The live recording meter measures incoming amplitude, not bird presence. Kit reload preserves an existing clip.

An optional Alabama seasonal filter runs BirdNET's official location model locally. It combines the maximum range score across three broad state sample points (north, center, coast), using BirdNET's 48-bin year (four bins per month), and excludes range scores below .03. Acoustic scores are never boosted or relabeled from range expectations. Pending/failed filtering hides regional suggestions rather than silently falling back to worldwide. Rare visitors can be hidden; Worldwide allows an unfiltered review. This broad-state prototype is not precise local occurrence data. Only the region preference persists, not audio or coordinates. The setup script now includes the ~7 MB range model.

On a real quiet recording, our first-window scores agreed with the official BirdNET browser implementation to within a few millionths. Whole-clip suggestions below .35 explain the empty standard result; successful synthetic fixtures do not establish real-world identification accuracy. A recording containing known birds can still fail to produce reliable model evidence. More field validation remains necessary.


## Personal learning and Studio rewards

The homepage adventure focuses an unrecognized Crow first, then the Two Voices comparison badge, then another developing unlocked bird. Focused adventures include their target in the next bounded flight. Recognition requires four correct answers in a five-attempt window over at least two flights; personal flight answers participate and record their saved clip ID. Up to three questions use opted-in clips probabilistically, with catalog references for the rest.

Studio now offers all 22 catalog voices. Cardinal and Blue Jay are immediate; the existing 5/6 phrase challenge retains its Robin/Wren reward. Every other voice opens upon flight recognition. Four independent lanes retain bird swaps, entry beats, trim, volume and pitch. Named mix recipes persist locally; pitch changes playback speed. Shared recording credits retain each source, creator and license and identify playback edits. Saved personal calls currently feed flights, not Studio samples.

## Hub update: shared welcoming versus voice recognition

The latest shared collection rules supersede earlier learning-only Studio gates. Every welcomed bird is available for music and companion selection. Flight recognition remains its own card mark. The hub separates Explore, Play & Learn, Make Music and Sanctuary; outdoor recording lives inside Explore and remains development-only. Collection milestones, field notes and companion care are local-only. No new recording uploads, accounts, trading or oracle readings were introduced in this update.

## Phrase workshop and musical memory

Make Music now includes an independent phrase workshop with catalog sources, saved calls/phrases and local file import. Edited audio is explicitly named and saved as a WAV, retaining its attribution and pitch-edit provenance. A phrase with any inherited or new pitch edit is permanently music-only within Birdsong. Unpitched, assigned and explicitly confirmed phrases can opt into future flights; the recording writer and flight planner both enforce eligibility. The original saved call is never overwritten by editing a copy. Existing songs remain local arrangement recipes and can be reopened in the DJ station. Bird Memory is a separate four-pad sequence game with local best scores and manual playback; it changes neither field identifications nor flight accuracy.

## Hosted noncommercial beta (October 2026)

This section supersedes earlier development-only distribution notes. Listen outside is now enabled in the production app for the free noncommercial educational test. The existing model files and labels are redistributed unchanged in public/birdnet; ATTRIBUTION.txt, LICENSE.txt and SOURCES.json preserve attribution, full CC BY-NC-SA 4.0 terms, upstream URLs and SHA-256 hashes. Automated tests verify all distributed assets and referenced shards. No paid/commercial permission has been obtained; commercial release would require an appropriate license or replacement model.

Users explicitly load the ~57 MB kit. Inference and audio remain on the device, with no automatic recording. Worker WebGL falls back to CPU; short clips are recommended if analysis is slow. Physical iOS/Android hardware and outdoor accuracy require user testing. Existing region filtering, confidence caveats, opt-in saved calls and cancellation remain in place.
