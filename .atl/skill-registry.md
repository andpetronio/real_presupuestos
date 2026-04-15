# Skill Registry

**Delegator use only.** Any agent that launches sub-agents reads this registry to resolve compact rules, then injects them directly into sub-agent prompts. Sub-agents do NOT read this registry or individual SKILL.md files.

See `_shared/skill-resolver.md` for the full resolution protocol.

## User Skills

| Trigger | Skill | Path |
|---------|-------|------|
| When creating a pull request, opening a PR, or preparing changes for review. | branch-pr | /Users/petro/.config/opencode/skills/branch-pr/SKILL.md |
| When writing Go tests, using teatest, or adding test coverage. | go-testing | /Users/petro/.config/opencode/skills/go-testing/SKILL.md |
| When creating a GitHub issue, reporting a bug, or requesting a feature. | issue-creation | /Users/petro/.config/opencode/skills/issue-creation/SKILL.md |
| When user says “judgment day”, “judgment-day”, “review adversarial”, “dual review”, “doble review”, “juzgar”, “que lo juzguen”. | judgment-day | /Users/petro/.config/opencode/skills/judgment-day/SKILL.md |
| When user asks to create a new skill, add agent instructions, or document patterns for AI. | skill-creator | /Users/petro/.config/opencode/skills/skill-creator/SKILL.md |
| Svelte components/modules (.svelte, .svelte.ts, .svelte.js): always load this skill first. | svelte-code-writer | /Users/petro/Developer/real/presupuestos/.agents/skills/svelte-code-writer/SKILL.md |
| Svelte 5 runes/snippets/SvelteKit patterns, migration, performance, and component testing. | svelte5-best-practices | /Users/petro/Developer/real/presupuestos/.agents/skills/svelte5-best-practices/SKILL.md |
| Internal CRUD for tutors/dogs/raw materials/recipes/settings in authenticated app area. | sveltekit-admin-crud | /Users/petro/Developer/real/presupuestos/.agents/skills/sveltekit-admin-crud/SKILL.md |
| SvelteKit + Supabase foundation, auth split, route boundaries, env conventions. | sveltekit-supabase-foundation | /Users/petro/Developer/real/presupuestos/.agents/skills/sveltekit-supabase-foundation/SKILL.md |
| Budget domain formulas and snapshot-ready calculation outputs. | budget-calculation-domain | /Users/petro/Developer/real/presupuestos/.agents/skills/budget-calculation-domain/SKILL.md |
| Multi-dog budget creation, assignment, preview, edit-before-send flow. | multi-dog-budget-flow | /Users/petro/Developer/real/presupuestos/.agents/skills/multi-dog-budget-flow/SKILL.md |
| Public token budget accept/reject/expire flow without auth. | public-budget-response-flow | /Users/petro/Developer/real/presupuestos/.agents/skills/public-budget-response-flow/SKILL.md |
| WhatsApp send adapter, editable message, persistence of final sent text. | whatsapp-delivery-adapter | /Users/petro/Developer/real/presupuestos/.agents/skills/whatsapp-delivery-adapter/SKILL.md |

## Compact Rules

Pre-digested rules per skill. Delegators copy matching blocks into sub-agent prompts as `## Project Standards (auto-resolved)`.

### branch-pr
- Every PR MUST link an approved issue (`status:approved`).
- PR MUST have exactly one `type:*` label.
- Branch format: `type/description` with allowed types only (`feat`, `fix`, etc.).
- Use conventional commits only; no non-standard trailers.
- Run shellcheck on modified scripts before opening PR.
- Use PR template fields: linked issue, summary, changes table, test plan.

### go-testing
- Default to table-driven tests for Go logic.
- Test Bubbletea state transitions via `Model.Update()` directly.
- Use `teatest` for interactive TUI flows and final model assertions.
- Use golden files for deterministic view/output snapshots.
- Test success and error paths explicitly (`wantErr`).
- For filesystem tests, isolate with `t.TempDir()`.

### issue-creation
- Always create issues from templates; blank issues are disabled.
- New issues start as `status:needs-review`.
- PR work starts only after maintainer adds `status:approved`.
- Questions belong in Discussions, not Issues.
- Choose correct template (bug vs feature) and fill required fields.
- Search duplicates before opening a new issue.

### judgment-day
- Resolve skill registry and inject compact rules before launching judges.
- Run two independent blind judges in parallel.
- Synthesize findings as confirmed/suspect/contradiction.
- Classify warnings as `real` vs `theoretical` (theoretical => INFO).
- Ask user before fixing confirmed findings after Round 1.
- Re-judge only for confirmed CRITICALs after Round 2+.

### skill-creator
- Create skills only for reusable, recurring patterns.
- `SKILL.md` frontmatter must include name/description+trigger/license/author/version.
- Keep critical patterns actionable; avoid long narrative.
- Prefer local references over external URLs in `references/`.
- Include commands and minimal focused examples.
- Register newly created skill in project conventions index.

### svelte-code-writer
- MUST be used whenever editing or reviewing `.svelte`/`.svelte.ts`/`.svelte.js`.
- Use `npx @sveltejs/mcp list-sections` before deep doc lookup.
- Fetch exact docs with `npx @sveltejs/mcp get-documentation "..."`.
- Validate components with `npx @sveltejs/mcp svelte-autofixer` before finalizing.
- Escape rune `$` as `\$` when passing inline code in shell.

### svelte5-best-practices
- Use runes: `$state` for mutable state, `$derived` for computed values.
- Use `onclick` (not `on:click`) in Svelte 5.
- Replace slots with snippets (`{#snippet}` / `{@render}`).
- Prefer callback props over `createEventDispatcher`.
- Use `$bindable()` for two-way bindable props.
- Avoid module-level mutable state in SSR to prevent cross-request leaks.

### sveltekit-admin-crud
- Keep internal CRUD flows simple and operator-friendly.
- Place persistence/business logic in server-side modules.
- Keep page components lightweight.
- Build clear validation and user-facing error handling.
- Use this only for master data CRUD; exclude budget workflow specifics.

### sveltekit-supabase-foundation
- Baseline stack: SvelteKit + TypeScript + Supabase.
- Keep business logic outside UI components.
- Separate authenticated internal routes from public token routes.
- Keep configuration environment-driven.
- Establish SSR-compatible Supabase integration and route protection.

### budget-calculation-domain
- Calculate costs per dog first, then aggregate at budget level.
- Daily intake belongs to dog; recipe items are daily quantities.
- Apply sale price formula `PV = CT / (1 - margin)`.
- Validate preconditions before calculation.
- Return structured, snapshot-ready outputs for history integrity.
- Do not mix with UI, CRUD, or transport concerns.

### multi-dog-budget-flow
- One budget can include one or many dogs.
- Keep per-dog recipe/day assignments explicit.
- Preview must be human-readable and editable before send.
- Keep totals consistent with domain calculation services.
- Model internal state transitions explicitly.
- Do not include provider transport or token-public logic.

### public-budget-response-flow
- Public response is token-based and unauthenticated.
- Token must be unique, non-guessable, and resolvable.
- Only valid sent budgets can be accepted/rejected.
- Empty rejection reason MUST normalize to `sin motivo`.
- Expired or already-answered budgets must reject further actions.
- Keep this isolated from admin CRUD and calculation logic.

### whatsapp-delivery-adapter
- Delivery target is the tutor WhatsApp number.
- Sender configuration must be externalized.
- Message is editable before send and final sent text is persisted.
- Use adapter interface so provider is swappable.
- Keep provider-specific code isolated from domain/application layers.
- Surface delivery failures explicitly.

## Project Conventions

| File | Path | Notes |
|------|------|-------|
| — | — | No `agents.md`/`AGENTS.md`/`CLAUDE.md`/`.cursorrules`/`GEMINI.md`/`copilot-instructions.md` found in project root. |

Read the convention files listed above for project-specific patterns and rules. All referenced paths have been extracted — no need to read index files to discover more.
