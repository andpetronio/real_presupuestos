# Skills Catalog

This project uses a two-layer skill strategy:

1. **External reusable skills from skills.sh**
2. **Local repository skills**

The goal is simple:
- do not reinvent generic engineering guidance
- do keep domain-specific business behavior explicit inside the repo

---

## 1. External Skills from skills.sh

External skills from skills.sh should be the first choice whenever the task is generic and reusable across many projects.

Typical areas where external skills should be preferred:

- SvelteKit project setup
- SvelteKit routing patterns
- Supabase integration
- Supabase SSR auth/session handling
- TypeScript project conventions
- forms and validation
- testing
- environment and deployment setup
- general UI and architectural patterns

### Rule
If the problem is general-purpose, look for an external skill from skills.sh first.

### Examples
Use external skills for things like:
- bootstrapping SvelteKit correctly
- wiring Supabase auth in SSR
- defining form handling conventions
- setting up testing structure
- deployment/environment patterns

---

## 2. Local Repository Skills

Local repository skills exist for behavior that is specific to this product and should not be delegated to generic reusable guidance.

These skills encode the business rules and workflow semantics of this application.

### Approved local skills

#### `sveltekit-admin-crud`
Use for:
- tutors
- dogs
- raw materials
- recipes
- settings
- standard internal CRUD flows

#### `budget-calculation-domain`
Use for:
- raw material cost
- recipe cost
- per-dog budget cost
- full budget cost
- sale price formula
- snapshot-ready calculation results

#### `multi-dog-budget-flow`
Use for:
- budget workflow
- adding multiple dogs
- assigning recipes and days per dog
- human-friendly preview
- edit-before-send behavior
- internal budget state transitions

#### `public-budget-response-flow`
Use for:
- token-based public routes
- public accept/reject flow
- empty reject reason normalization
- expiration handling
- duplicate response prevention

#### `whatsapp-delivery-adapter`
Use for:
- sender configuration
- editable outgoing message
- delivery integration
- sent message persistence
- delivery error handling

---

## How to choose which skill to use

### Use an external skill from skills.sh when:
- the task is generic
- the task is not unique to this business
- the guidance would be useful in many other projects

### Use a local repository skill when:
- the task implements product-specific rules
- the task defines domain behavior unique to this app
- the task encodes decisions already made in the specs

### Use both when needed
Many real tasks will require:
- one external skill for the technical foundation
- one local skill for the domain behavior

This is expected.

Example:
- for a protected internal page with form handling and persistence:
  - use external skills from skills.sh for SvelteKit/Supabase/forms
  - use local `multi-dog-budget-flow` for the business logic and workflow rules

---

## Skill Selection Heuristic

When an agent receives a task, it should ask:

### 1. What part of this task is generic?
That part should use skills.sh skills.

### 2. What part of this task is specific to this product?
That part should use local repository skills.

### 3. Is the local skill extending domain behavior or just duplicating generic setup?
If it is only duplicating generic setup, prefer the external reusable skill instead.

---

## Examples

### Example A - Setting up authenticated internal routes
Primary source:
- external skills from skills.sh for SvelteKit + Supabase SSR auth

Possible local skill:
- none, unless the route behavior includes product-specific workflow rules

### Example B - Implementing tutor CRUD
Primary sources:
- external skills from skills.sh for forms, routing, and persistence patterns
- local `sveltekit-admin-crud` for product-consistent admin behavior

### Example C - Implementing budget calculation
Primary sources:
- external skills from skills.sh for TypeScript/service/module organization if needed
- local `budget-calculation-domain` for formulas and business rules

### Example D - Implementing public accept/reject flow
Primary sources:
- external skills from skills.sh for SvelteKit public route patterns
- local `public-budget-response-flow` for token semantics, expiration, and response rules

### Example E - Sending WhatsApp messages
Primary sources:
- external skills from skills.sh for provider integration patterns if relevant
- local `whatsapp-delivery-adapter` for product-specific sender/message/delivery semantics

---

## Repository Convention

Local skills are stored in:

```text
/skills/<skill-name>/SKILL.md