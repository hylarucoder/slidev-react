# slidev-react Feature Roadmap vs Slidev

Last updated: 2026-03-07

## Goal

`slidev-react` should not aim for blind 1:1 parity with Vue Slidev.

The better strategy is:

- keep the React-first runtime direction
- selectively close the highest-value capability gaps with Slidev
- prioritize authoring model, delivery workflow, and extensibility over long-tail syntax parity

## Current Read

The project already has a strong runtime foundation:

- presenter / viewer split
- multi-tab and optional cross-device sync
- reveal flow
- drawing
- quick overview
- browser recording
- MDX-based deck authoring

The biggest gaps vs official Slidev are not around basic playback.
They are around:

- deck metadata richness
- speaker workflow completeness
- export and sharing
- theme / addon extensibility
- authoring DX

## Progress Snapshot

This document started as a roadmap. It now also reflects implementation status in the repo.

Completed:

- speaker notes parsing, runtime payloads, presenter notes panel, and notes workspace
- first-batch metadata support for `background`, `src`, `transition`, `clicks`, `notes`, and `exportFilename`
- runtime wiring for the shipped metadata fields above
- browser print export entry
- Playwright-based PDF export
- Playwright-based PNG export
- slide-range export via `--slides`
- click-expanded export via `--with-clicks`
- theme contract and local theme loading with a built-in `paper` example theme
- addon registration seams with a built-in `insight` example addon

Partial:

- first-batch metadata expansion is still missing `monaco`
- diagnostics are better than the original MVP, with field-level frontmatter errors, deck lint warnings for unknown theme/addon/layout references, and a dedicated `bun run lint:deck` entry point, but not yet at "best-in-class authoring DX"
- export architecture is in place, but not yet expanded to PPTX / Markdown or a richer UI
- theme work currently focuses on local folders, not package-distributed themes yet
- addon work currently focuses on local folders, not package-distributed addons yet
- presenter pro controls now include wake lock, mirror-stage launch, fullscreen, stage scale, and idle-cursor settings, but not a full multi-display control center yet

Not started in earnest:

- Monaco / live coding track

## Product Direction

Use this as the guiding rule for future feature decisions:

1. Build a better React-native presentation system first
2. Add compatibility only when it unlocks real deck migration or clear user value
3. Avoid importing Vue-specific mental models when a React-first abstraction is cleaner

## Priority Plan

| Phase | Theme                                                       | Why now                                               | Main areas                                                        |
| ----- | ----------------------------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------- |
| P0    | Notes, metadata model, export                               | These unlock real presentation and delivery workflows | `src/deck`, `src/features/presenter`, `src/features/presentation` |
| P1    | Theme/addon architecture, presenter pro tools, authoring DX | These make the system scalable and more reusable      | `src/theme`, `src/app`, `src/ui`, `src/deck`                      |
| P2    | Monaco/live coding, selective compatibility layer           | Valuable, but not as urgent as content and delivery   | `src/ui/mdx`, `src/deck`, `src/features/player`                   |

## P0

### 1. Speaker Notes End-to-End

Why this matters:

- The presenter UI already has a notes panel, but it is still placeholder-only
- This is one of the fastest upgrades from "can present" to "can truly deliver talks"

Scope:

- parse notes from slide source
- support per-slide notes in the deck model
- render notes in presenter mode
- show note-aware click progress together with reveal progress
- add a dedicated notes editing or notes overview surface

Implementation touchpoints:

- `src/deck/parsing/`
- `src/deck/model/`
- `src/features/presenter/`

Done when:

- notes are authored in deck source and survive compile time
- notes appear in presenter mode for the active slide
- presenter can review notes without modifying the slide body

### 2. Deck / Slide Metadata Model Expansion

Why this matters:

- The current frontmatter surface is too narrow for a serious deck authoring system
- Official Slidev is much stronger here than in raw runtime effects

Recommended first batch:

- `background`
- `src`
- `transition`
- `clicks`
- `monaco`
- `exportFilename`
- `notes`

Nice second batch:

- `colorSchema`
- `layoutProps`
- `routeAlias`
- `hideInToc`

Implementation touchpoints:

- `src/deck/parsing/parseDeck.ts`
- `src/deck/model/`
- `src/theme/layouts/`
- `src/features/reveal/`

Done when:

- frontmatter is validated by schema instead of silently ignored
- deck artifacts preserve the new metadata
- runtime behavior actually consumes the new fields where applicable

### 3. Export and Share Workflow

Why this matters:

- Recording is useful, but it is not a replacement for shareable output
- Export is critical for training, consulting, teaching, and async review

Recommended scope order:

1. browser-side export entry point
2. PDF export
3. PNG slide snapshots
4. optional click-expanded export
5. later: PPTX / Markdown export if needed

Implementation touchpoints:

- `src/app/`
- `src/features/presentation/`
- build scripts under `scripts/`

Done when:

- a user can produce a stable artifact without screen recording
- export works on a real deck with reveal steps
- exported output matches the current slide theme and layout

## P1

### 4. Theme and Addon Architecture

Why this matters:

- `theme` is already present in metadata, but not yet wired into runtime behavior
- Without a theme/addon contract, future customization will become ad-hoc and expensive

Scope:

- define theme contract
- support local theme packages or theme folders
- allow theme-provided layouts, tokens, and MDX components
- define addon lifecycle and registration points

Implementation touchpoints:

- `src/theme/`
- `src/app/providers/`
- `src/ui/mdx/`
- `src/deck/build/`

Done when:

- switching themes changes actual runtime output
- a theme can contribute layout and style behavior without patching app core
- addon hooks are explicit and documented

### 5. Presenter Pro Controls

Why this matters:

- This reduces real-world presentation failure more than flashy slide effects do
- Official Slidev invests heavily in presenter ergonomics for a reason

Recommended scope:

- screen mirror mode
- wake lock
- display scale controls
- idle cursor behavior
- richer presenter settings
- session timer polish

Implementation touchpoints:

- `src/features/presenter/`
- `src/features/player/`
- `src/features/presentation/`

Done when:

- presenter can confidently use the tool on a projector or external display
- core settings are discoverable without leaving presenter mode

### 6. Authoring DX

Why this matters:

- Strong runtime with weak authoring UX usually stalls adoption
- Deck authors need feedback earlier than runtime

Scope:

- frontmatter and deck diagnostics
- better compile errors
- authoring guide for repo-native syntax
- optional schema hints and editor snippets
- deck linting for invalid metadata and missing components

Implementation touchpoints:

- `src/deck/`
- `README.md`
- editor or script tooling as needed

Done when:

- common authoring errors are caught before runtime
- error output points to the right slide and the right field

## P2

### 7. Monaco / Live Coding Features

Why this matters:

- This is strategically valuable if the deck audience is developer education
- It is not foundational for every deck, so it should follow P0/P1

Scope:

- configurable Monaco defaults
- embeddable runnable code blocks
- presentation-safe reset / replay behavior

Implementation touchpoints:

- `src/ui/mdx/`
- `src/features/player/`
- deck metadata if code playground behavior becomes configurable

### 8. Selective Compatibility Layer

Why this matters:

- Some compatibility features can reduce migration cost from Slidev
- Full parity is expensive and not aligned with the React-first direction

Recommended candidates:

- imported slide source via `src`
- a small compatibility map for common frontmatter keys
- migration docs from Slidev to `slidev-react`

Not recommended right now:

- full Vue directive parity
- deep emulation of Vue-only primitives

## Non-Goals for Now

Avoid these until P0 and P1 are meaningfully complete:

- full 1:1 parity with Slidev syntax
- marketplace-style theme ecosystem
- broad plugin API before the core theme/addon contract is stable
- flashy animation systems that do not improve authoring or delivery reliability

## Suggested Issue Breakdown

Completed:

- Add notes parsing and deck model support
- Render real notes in presenter mode
- Add notes overview or notes workspace
- Expand frontmatter schema with first-batch metadata except `monaco`
- Wire shipped metadata to runtime behavior
- Design browser export flow and artifact format
- Implement PDF export
- Implement PNG snapshot export

Partial:

- Improve compile-time deck diagnostics
- Finish first-batch metadata with `monaco`

Next:

- Define theme contract and local theme loading
- Define addon registration points
- Add presenter display settings
- Add wake lock and screen mirror support
- Document migration path from Slidev to `slidev-react`

## Execution Sequence

Recommended order of implementation:

1. expand deck model before adding new presenter or export UI
2. land notes parsing before redesigning the speaker notes panel
3. define export data shape before choosing export formats
4. define theme contract before exposing public addon hooks
5. improve diagnostics alongside every metadata expansion, not after

Reasoning:

- deck metadata is the base layer for notes, export, theme, and compatibility
- presenter improvements become much easier once notes and metadata are real model fields
- addon architecture should be designed on top of stable core concepts, not placeholders

## Dependency Map

### Foundation Layer

- frontmatter schema expansion
- deck model expansion
- compiled deck artifact updates
- diagnostics and error reporting

Everything else depends on this layer.

### Presentation Layer

- speaker notes UI
- presenter controls
- click / reveal metadata integration
- screen mirror and wake lock

This layer depends on the foundation layer being stable.

### Delivery Layer

- export entry point
- print or snapshot pipeline
- click-expanded output
- export naming and output metadata

This layer depends on both the foundation layer and enough presentation stability to know what should be exported.

### Extension Layer

- theme contract
- local theme loading
- addon registration points
- compatibility helpers

This layer should come after core metadata and runtime seams are stable.

## Milestones

### Milestone A: Authoring Model Becomes Real

Target outcome:

- deck and slide metadata move beyond MVP-only fields
- notes become first-class data
- compile errors become much more actionable

Ship checklist:

- [x] notes field supported in authoring flow
- [x] first-batch metadata mostly supported in parser and model
- [x] generated deck output includes shipped new fields
- [ ] parser and compile errors identify slide index and field name

Status:

- mostly complete
- remaining gap is diagnostics polish and `monaco`

### Milestone B: Presenter Workflow Feels Production-Ready

Target outcome:

- a speaker can prepare, rehearse, and deliver from presenter mode with confidence

Ship checklist:

- [x] presenter shows real notes
- [x] reveal progress and notes progress work together coherently
- [ ] display controls are available in presenter mode
- [ ] wake lock or equivalent stay-awake behavior is supported

Status:

- partially complete
- the rehearsal workflow is real, but presenter pro controls are still missing

### Milestone C: Decks Become Deliverables

Target outcome:

- a deck can be shared asynchronously without relying on screen recording

Ship checklist:

- [x] export entry is available
- [x] PDF export works on a real deck
- [x] PNG export works on a real deck
- [x] output naming is controllable from metadata

Status:

- complete for the current static-export scope
- future expansion can target PPTX / Markdown or richer export UX

### Milestone D: Runtime Becomes Extensible

Target outcome:

- themes and future addons can extend behavior without patching core files

Ship checklist:

- [ ] theme contract documented
- [ ] at least one non-default theme loads through the new mechanism
- [ ] theme can provide layout or token overrides
- [ ] addon registration seam exists and is documented

Status:

- not started

## Acceptance Criteria by Track

### Notes Track

- notes can be authored in a stable syntax
- notes survive parsing, compiling, and runtime rendering
- presenter notes update when slide changes
- notes do not leak into viewer mode unless explicitly intended

### Metadata Track

- invalid metadata fails clearly
- valid metadata produces predictable runtime behavior
- unsupported metadata is either rejected or explicitly ignored with diagnostics

### Export Track

- export output is deterministic for the same deck source
- layouts and code highlighting match runtime output closely
- reveal-aware export behavior is explicit rather than surprising

### Theme / Addon Track

- custom theme code is loaded through a defined interface
- default theme remains the fallback when theme loading fails
- addon boundaries do not require editing unrelated runtime modules

## Risks and Watchouts

### Risk 1: Metadata Sprawl

If metadata is added too quickly without a clear model, the deck system will become harder to reason about.

Mitigation:

- add fields in named batches
- define ownership for each field
- reject ambiguous fields early

### Risk 2: Export Mismatch

If export rendering diverges from runtime rendering, users will stop trusting export.

Mitigation:

- reuse runtime layouts and compiled deck artifacts as much as possible
- validate export against real sample decks, not synthetic slides only

### Risk 3: Theme API Freeze Too Early

If a public extension contract is exposed before the internal seams settle, future refactors become painful.

Mitigation:

- ship local theme loading before broad addon promises
- mark early extension points as experimental until exercised by at least one real custom theme

## Suggested Backlog Split by Sprint

### Sprint 1

- notes parsing
- deck model expansion
- first-batch metadata schema
- improved parser diagnostics

### Sprint 2

- presenter notes rendering
- notes overview
- click / notes integration
- presenter display settings

### Sprint 3

- export entry point
- PDF export
- PNG export
- export metadata support

### Sprint 4

- theme contract
- local theme loading
- addon seam draft
- migration documentation

## Immediate Recommendation

If only one stream should start now, start with:

1. notes parsing + deck model expansion
2. metadata schema expansion
3. parser diagnostics

This is the highest-leverage sequence because it improves both current runtime quality and all future feature work.

## Detailed Backlog Cards

Use the following cards as near-ready issue drafts.

### B001. Add Speaker Notes to the Deck Model

Status:

- done

Priority:

- P0

Problem:

- presenter mode already reserves space for notes, but notes are not first-class deck data yet

Goal:

- support stable per-slide notes in parsing, model, compile, and runtime payloads

Scope:

- define notes authoring syntax
- parse notes from slide source
- store notes on slide model
- include notes in generated deck artifacts
- add tests for parsing edge cases

Out of scope:

- rich notes editing UI
- notes search across the whole deck

Dependencies:

- none, this is a foundation issue

Done when:

- a slide can contain notes in a documented syntax
- compiled slide data exposes notes
- tests cover notes parsing success and invalid syntax cases

### B002. Render Real Notes in Presenter Mode

Status:

- done

Priority:

- P0

Problem:

- the current notes panel is a placeholder and does not help actual presentation delivery

Goal:

- show active slide notes inside presenter mode with sensible formatting

Scope:

- feed notes into presenter shell
- replace placeholder copy in notes panel
- support empty-state behavior when a slide has no notes
- ensure notes switch correctly on navigation

Out of scope:

- editing notes inline
- syncing notes to viewer mode

Dependencies:

- B001

Done when:

- presenter sees current slide notes
- notes update correctly as active slide changes
- empty slides still show a clean fallback state

### B003. Add Notes Overview or Notes Workspace

Status:

- done

Priority:

- P0

Problem:

- even with per-slide notes, speakers still need a way to review notes across the deck efficiently

Goal:

- make rehearsal and script review practical

Scope:

- add a presenter-accessible notes overview surface
- show slide title, index, and notes summary
- support jump-to-slide from the notes surface

Out of scope:

- WYSIWYG editing
- full deck management UI

Dependencies:

- B001
- B002

Done when:

- presenter can review notes for multiple slides without paging through the deck one by one
- selecting an item in the notes view navigates to the expected slide

### B004. Expand Frontmatter Schema Batch 1

Status:

- partial

Priority:

- P0

Problem:

- the current metadata model is too narrow to support a serious authoring system

Goal:

- add the first high-value batch of deck and slide metadata

Scope:

- support `background`
- support `src`
- support `transition`
- support `clicks`
- support `monaco`
- support `exportFilename`
- support `notes` if not covered entirely by B001
- add validation tests

Out of scope:

- support every Slidev key
- compatibility aliases for all legacy fields

Dependencies:

- none, but should land before related runtime features

Done when:

- parser accepts valid first-batch metadata
- invalid values fail clearly
- deck artifacts preserve the new fields

Current gap:

- `monaco` is still not implemented

### B005. Wire New Metadata to Runtime Behavior

Status:

- partial

Priority:

- P0

Problem:

- metadata has limited value if it is parsed but ignored at runtime

Goal:

- connect first-batch metadata to visible behavior

Scope:

- apply `background` in stage rendering
- resolve `src` for imported slide content if adopted
- integrate `clicks` with reveal defaults if adopted
- pass `transition` and `monaco` metadata through the runtime seam even if some behaviors stay experimental
- use `exportFilename` in export flow

Out of scope:

- advanced animation framework
- complete Monaco feature set

Dependencies:

- B004

Done when:

- each shipped metadata field has either real behavior or an explicitly documented runtime status
- no field is silently accepted without clear semantics

Current gap:

- `monaco` has no runtime seam yet
- `theme` is still metadata-only rather than a real runtime contract

### B006. Improve Deck Diagnostics and Compile Errors

Status:

- partial

Priority:

- P0

Problem:

- authoring errors are expensive when deck tooling cannot point to the right slide and field quickly

Goal:

- make authoring failures fast to diagnose

Scope:

- improve parser errors with slide index and field context
- improve compile-time messages for missing components or invalid metadata
- document common failure modes
- add regression tests for representative bad input

Out of scope:

- full IDE integration
- language server support

Dependencies:

- should progress alongside B001 and B004

Done when:

- invalid frontmatter names and values produce actionable errors
- compile failures mention the failing slide or source region where practical

Current state:

- parser errors now include the failing frontmatter field instead of only a generic schema dump
- compile-time generation warns for unknown local themes, addons, and layouts before runtime fallback
- `bun run lint:deck` gives authors a fast pre-build check, with optional `--strict` mode for CI
- the remaining gap is richer deck linting and broader metadata diagnostics

### B007. Design Export Architecture

Status:

- done

Priority:

- P0

Problem:

- export is strategically important, but implementing formats first without a shared model usually creates rework

Goal:

- define one export entry and one export-ready data path before shipping formats

Scope:

- define export trigger surface
- define export payload shape
- decide how reveal states are expanded or flattened
- define filename behavior and output metadata
- document browser-only vs script-assisted export paths

Out of scope:

- final polished UI for every export mode
- PPTX export

Dependencies:

- B004
- B005

Done when:

- the team can explain how a slide becomes an exportable artifact end to end
- PDF and PNG implementation can proceed without reopening core architecture questions

### B008. Ship PDF and PNG Export

Status:

- done

Priority:

- P0

Problem:

- users need shareable artifacts beyond live presentation or screen recording

Goal:

- support practical static export for async use cases

Scope:

- implement PDF export
- implement PNG export
- support deck-level output naming
- verify output against at least one real deck with reveal steps and code blocks

Out of scope:

- PPTX export
- animated video export

Dependencies:

- B007

Done when:

- users can export a real deck to PDF and PNG
- output is visually close to runtime rendering
- reveal behavior in export is documented and tested

Current state:

- browser print, Playwright PDF, PNG, `--slides`, and `--with-clicks` are all implemented

### B009. Add Presenter Display Controls

Status:

- partial

Priority:

- P1

Problem:

- presenter mode still lacks some of the operational controls that reduce live presentation risk

Goal:

- make presenter mode more production-ready on projectors and external displays

Scope:

- display scale controls
- screen mirror mode or equivalent
- wake lock
- simple presenter settings surface

Out of scope:

- full presenter customization center
- remote admin panel

Dependencies:

- B002

Done when:

- presenter can adjust display behavior without leaving presenter mode
- long talks are less likely to fail due to sleep or display mismatch

Current state:

- wake lock toggle is available in the presenter live panel
- a mirror-stage button can open the clean viewer surface from presenter mode
- stage scale can be adjusted from presenter settings
- fullscreen can be toggled directly from presenter mode
- cursor visibility can be kept always-on or hidden when idle
- deeper multi-display tuning is still open

### B010. Define Theme Contract and Local Theme Loading

Status:

- complete

Priority:

- P1

Problem:

- customization currently depends too much on core code changes

Goal:

- establish an extensibility seam for visual customization

Scope:

- define theme interface
- load a theme from a local folder or package-like boundary
- allow theme to provide tokens and layouts
- document default fallback behavior

Out of scope:

- theme marketplace
- public remote theme registry

Dependencies:

- B004
- B005

Done when:

- at least one custom theme loads through the new contract
- the default theme remains a safe fallback

Implementation note:

- completed on 2026-03-07 with automatic discovery of local themes under `src/theme/themes/*/index.ts`
- the shipped `paper` theme proves layout overrides, MDX component overrides, auto-loaded theme CSS, and default fallback behavior

### B011. Define Addon Registration Seams

Status:

- complete

Priority:

- P1

Problem:

- without clear extension seams, future integrations will patch internals directly

Goal:

- create explicit addon entry points after the theme/runtime seam is clearer

Scope:

- define addon registration lifecycle
- document where addons can extend MDX components, layouts, or runtime hooks
- mark early API stability expectations

Out of scope:

- large public addon ecosystem launch
- compatibility with every possible third-party extension style

Dependencies:

- B010

Done when:

- addon extension points are documented
- an example addon can be wired without editing unrelated runtime modules

Implementation note:

- completed on 2026-03-07 with automatic discovery of local addons under `src/addons/*/index.ts`
- the shipped `insight` addon proves deck-level addon activation, custom layout registration, MDX component injection, provider composition, and auto-loaded addon CSS

### B012. Document Slidev-to-slidev-react Migration

Status:

- complete

Priority:

- P1

Problem:

- teams evaluating migration need clarity on what maps cleanly, what differs, and what is intentionally unsupported

Goal:

- reduce adoption friction and set expectations honestly

Scope:

- document syntax equivalents
- document unsupported or intentionally different features
- give migration examples for notes, reveal flow, layouts, and metadata

Out of scope:

- automated migration CLI
- full compatibility promise

Dependencies:

- B001
- B004
- B005
- B010

Done when:

- a Slidev user can quickly assess migration cost
- the docs make the React-first direction explicit instead of implying full parity

Implementation note:

- completed on 2026-03-07 with a dedicated migration guide under `docs/migration/slidev-to-slidev-react.md`
- the guide covers what maps cleanly, what needs rewriting, what is intentionally different, and a recommended migration order

## Reference Baseline

Compared against official Slidev docs checked on 2026-03-06:

- https://sli.dev/
- https://sli.dev/guide/syntax
- https://sli.dev/guide/ui
- https://sli.dev/guide/theme-addon
- https://sli.dev/guide/exporting
- https://sli.dev/custom/config-monaco
