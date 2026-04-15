# 000 - Foundation Svelte
# Implementation Plan

## Status
Ready for execution

## Goal

Create the technical foundation of the new SvelteKit application so that feature work can proceed on top of a stable, coherent base.

This plan explicitly assumes a two-layer skill strategy:

1. external reusable skills from skills.sh
2. local repository skills for product-specific behavior

The foundation phase must establish not only the codebase and infrastructure baseline, but also the implementation discipline that agents will follow in future specs.

## Execution Principles

1. Reuse before invention.
2. Prefer external reusable skills from skills.sh for generic technical concerns.
3. Use local repository skills only for domain-specific product behavior.
4. Keep business logic outside Svelte components.
5. Keep public token-based flows separate from authenticated internal flows.
6. Keep future budgeting/history requirements in mind from the start.

## Skill Strategy for This Plan

## External skills from skills.sh should be used first for:
- SvelteKit project setup
- Supabase integration
- SSR auth/session setup
- TypeScript conventions
- forms and validation foundations
- testing foundations
- environment/deployment conventions
- generic architectural patterns

## Local skills should be used for:
- internal admin CRUD behavior specific to this product
- budget calculation rules
- multi-dog budget workflow
- public budget token response behavior
- WhatsApp delivery semantics

## Approved local skills for later phases

- `sveltekit-admin-crud`
- `budget-calculation-domain`
- `multi-dog-budget-flow`
- `public-budget-response-flow`
- `whatsapp-delivery-adapter`

Note:
This foundation phase does not require using all local skills yet, but it must prepare the project to support them cleanly.

---

## Phase 1 - Project Bootstrap

## Objective
Create the base SvelteKit project with TypeScript and establish the project skeleton.

## Skill usage
### External skills from skills.sh
Use external reusable skills for:
- SvelteKit initialization
- TypeScript project conventions
- baseline folder structure guidance

### Local skills
No local repository skill should be the primary driver of this phase unless a project-specific structural rule becomes necessary.

## Tasks
- Create a new SvelteKit project
- Enable TypeScript
- Establish base folder structure
- Establish environment variable conventions
- Establish coding conventions if desired
- Add baseline README/project notes if needed

## Deliverables
- SvelteKit project boots correctly
- TypeScript is enabled
- base folders exist
- environment variable approach is documented

## Exit Criteria
- app runs locally
- folder structure exists and is understandable
- no framework ambiguity remains

---

## Phase 2 - Supabase Integration and Auth Foundation

## Objective
Integrate Supabase as database and internal authentication backend in an SSR-compatible way.

## Skill usage
### External skills from skills.sh
Use external reusable skills for:
- Supabase integration
- SSR auth/session setup
- environment configuration
- security/session handling patterns

### Local skills
No local repository skill should be primary here unless a later product rule requires a small project-specific auth note.

## Tasks
- Configure Supabase project variables
- Configure server-side Supabase usage
- Configure internal auth/session handling
- Establish authenticated vs public route expectations
- Confirm that internal routes can be protected
- Confirm that public token routes can remain unauthenticated

## Deliverables
- Supabase connectivity works
- internal authentication foundation works
- SSR-compatible session handling is in place
- route separation between internal and public is viable

## Exit Criteria
- authenticated internal area can be protected
- unauthenticated public route area can exist cleanly
- Supabase is usable as the application backend

---

## Phase 3 - Route Structure and App Shell

## Objective
Create the route structure and app layout baseline for internal and public flows.

## Skill usage
### External skills from skills.sh
Use external reusable skills for:
- SvelteKit route organization
- layout patterns
- navigation patterns
- SSR route handling conventions

### Local skills
Still not primary in this phase, except where route naming or separation should reflect future product flows.

## Tasks
- Create `(app)` route group for internal authenticated area
- Create `budget-response/[token]` route group for public flow
- Create base internal app shell
- Create base navigation placeholders
- Establish shared layout conventions

## Deliverables
- internal route area exists
- public route area exists
- layouts are separated appropriately
- navigation strategy is clear

## Exit Criteria
- future CRUD and workflow pages have a clear home
- public token flow has a clear home
- route boundaries are clean

---

## Phase 4 - Server Architecture Conventions

## Objective
Define and establish where server-side logic lives.

## Skill usage
### External skills from skills.sh
Use external reusable skills for:
- server-side module organization
- validation patterns
- service/repository separation guidance
- TypeScript module conventions

### Local skills
Foundation should prepare for later local skill usage, but not replace generic structure decisions with domain-heavy choices too early.

## Tasks
- Establish repository location and conventions
- Establish service location and conventions
- Establish validator location and conventions
- Establish naming conventions for server-side modules
- Document that business logic must not live in components

## Deliverables
- `src/lib/server/...` conventions are defined
- repositories/services/validators have a clear place
- future business logic has a clean architectural home

## Exit Criteria
- the project can support complex business features without scattering logic into pages/components
- conventions are explicit enough for future agents

---

## Phase 5 - Skills Integration Baseline

## Objective
Prepare the repo so agents can use both external skills from skills.sh and local repository skills coherently.

## Skill usage
### External skills from skills.sh
This phase should explicitly acknowledge that generic skills are expected to be pulled from skills.sh as the first source for reusable implementation guidance.

### Local skills
This phase prepares the local skills directory and local skill catalog for domain-specific work.

## Tasks
- Create `/skills` directory
- Add local repository skills
- Add `skills/README.md`
- Document the distinction between:
  - external skills from skills.sh
  - local repository skills
- Ensure future feature plans refer to both skill layers correctly

## Deliverables
- local skills directory exists
- local skills are documented
- skill usage policy is explicit in the repo

## Exit Criteria
- agents can identify when to use skills.sh vs local skills
- local skills are not confused as replacements for reusable external guidance

---

## Phase 6 - Foundation Validation

## Objective
Confirm that the foundation is ready for product feature work.

## Skill usage
### External skills from skills.sh
Use external skills for:
- testing/setup validation patterns
- project sanity checks
- environment readiness checks

### Local skills
No local domain skill should dominate this phase.

## Tasks
- confirm local run works
- confirm auth flow works
- confirm route structure works
- confirm Supabase integration works
- confirm server-side architecture folders are usable
- confirm skills strategy is documented and understandable

## Deliverables
- a stable starting point for feature specs
- documented conventions
- working technical baseline

## Exit Criteria
- the project is ready for implementation of `001-multi-dog-budgeting-and-delivery`
- there is no ambiguity about stack, auth, structure, or skill usage

---

## Suggested Agent Breakdown

This section is optional orchestration guidance.

### Agent A - Foundation Setup
Owns:
- SvelteKit bootstrap
- TypeScript setup
- project structure

Uses primarily:
- external skills from skills.sh

### Agent B - Supabase/Auth Setup
Owns:
- Supabase configuration
- SSR auth/session foundation
- protected internal route setup

Uses primarily:
- external skills from skills.sh

### Agent C - Architecture/Structure
Owns:
- repository/service/validator layout
- route structure
- app shell baseline

Uses primarily:
- external skills from skills.sh

### Agent D - Skills Integration
Owns:
- local skills directory
- local skill catalog
- skill usage documentation

Uses:
- project specs
- local repository skills as content artifacts
- external reusable guidance as needed

---

## Risks and Guardrails

### Risk 1 - Overbuilding the foundation
Agents may try to overengineer architecture before feature work starts.

Guardrail:
Keep the foundation clean and sufficient, not academic.

### Risk 2 - Ignoring skills.sh
Agents may jump straight to local custom patterns for generic setup work.

Guardrail:
Use external reusable skills first for general technical concerns.

### Risk 3 - Duplicating generic knowledge locally
Agents may create local skills that just restate reusable external guidance.

Guardrail:
Local skills should encode product-specific behavior, not generic setup.

### Risk 4 - Pushing business logic into components
Agents may place domain logic inside route files or Svelte components.

Guardrail:
Business logic belongs in server-side services/repositories/validators.

### Risk 5 - Blurring internal/public route concerns
Agents may mix authenticated app logic and public token logic too early.

Guardrail:
Keep route areas explicitly separate from the foundation stage onward.

---

## Definition of Done

This foundation is done when:

- the SvelteKit app exists and runs
- Supabase is integrated
- internal auth is established
- internal and public route areas are clearly separated
- server-side architecture conventions are in place
- the repo contains a documented two-layer skill strategy
- external reusable skills from skills.sh are formally recognized as first-choice for generic concerns
- local repository skills are formally recognized as the source of product-specific behavior
- the project is ready to start implementing `001-multi-dog-budgeting-and-delivery`