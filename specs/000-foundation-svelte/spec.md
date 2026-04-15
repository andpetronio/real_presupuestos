# 000 - Foundation Svelte

## Status
Approved for implementation

## Owner
Product / Engineering

## Purpose

Define the technical foundation for a new application built from scratch in SvelteKit, replacing the previous Laravel/Filament approach.

This foundation spec establishes the architectural decisions, stack choices, conventions, skill strategy, and implementation guardrails that all later feature specs must follow.

## Product Context

The application will support the internal management and delivery of personalized meal-plan budgets for pets.

The first business domain to implement is budgeting and delivery, but this spec focuses only on the technical and architectural baseline.

## Approved Stack

### Frontend / App Framework
- SvelteKit
- Svelte 5
- TypeScript

### Backend / Infrastructure
- Supabase PostgreSQL
- Supabase Auth for internal app authentication
- Supabase Storage only if later required
- WhatsApp delivery through a provider adapter

### Deployment Target
- Web deployment suitable for SSR application hosting

## Architectural Principles

### 1. Start simple, but not sloppy
The application should be lightweight, readable, and easy to extend.

### 2. Business logic must be framework-independent
Core budgeting logic must not live directly in Svelte components.

### 3. Use server-side code for business operations
Critical operations must be implemented in server-side modules and invoked by routes/actions.

### 4. Supabase is the source of truth for data
PostgreSQL in Supabase is the primary data store.

### 5. Internal and public flows are different
The internal app is authenticated.
The public budget response flow is unauthenticated and token-based.

### 6. History must be trustworthy
Historical budgets must not change meaning after future cost or parameter changes.

### 7. Prefer reuse before invention
When a problem is general and already covered by a reusable skill, prefer using an existing skill before creating custom project-specific guidance.

## Application Areas

### Internal app
Authenticated operator area for:
- tutors
- dogs
- raw materials
- recipes
- budgets
- settings

### Public app
Token-based public pages for:
- viewing a budget
- accepting a budget
- rejecting a budget
- seeing expired state

## Recommended Project Structure

```text
src/
  lib/
    server/
      auth/
      db/
      repositories/
      services/
        budgets/
        recipes/
        raw-materials/
        messaging/
      validators/
      utils/
    components/
    stores/
    utils/
  routes/
    (app)/
      dashboard/
      tutors/
      dogs/
      raw-materials/
      recipes/
      budgets/
      settings/
    budget-response/
      [token]/
```

These local skills do not replace skills.sh.
They complement it.

## Guardrails
### Do not:
- create local skills for every generic technical concern
- duplicate external reusable knowledge inside local skills without reason
- ignore local skills when implementing business-specific behavior
### Do:
- use skills.sh first for reusable technical patterns
- use local skills for domain-specific product rules
- combine both when a task contains both technical and business concerns
- Practical Rule for This Project
- External reusable skills from skills.sh:

First choice for technical foundation and generic implementation patterns.

## Local repository skills:

First choice for product behavior, business workflow, and domain rules.

That split is intentional and should remain stable throughout the project.