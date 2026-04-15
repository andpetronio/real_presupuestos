# 001 - Multi Dog Budgeting and Delivery
# Implementation Plan

## Status
Ready for execution

## Goal

Implement the budgeting MVP on top of the new Svelte foundation, including multi-dog budgets, editable preview, WhatsApp delivery, public response flow, and historical trust.

## Phases

### Phase 1 - Core schema
- tutors
- dogs
- raw materials
- recipes
- recipe items
- budgets
- budget dogs
- budget dog recipes
- budget snapshots
- settings / operational parameters

### Phase 2 - Internal CRUD
- tutors
- dogs
- raw materials
- recipes
- settings

### Phase 3 - Budget calculation domain
- cost per raw material
- cost per recipe
- cost per dog inside budget
- budget total
- sale price formula
- snapshot assembly

### Phase 4 - Multi-dog budget flow
- create draft
- add dogs
- assign recipes
- assign days
- add operational inputs
- calculate preview
- edit before send

### Phase 5 - WhatsApp delivery
- sender configuration
- editable message draft
- delivery adapter
- sent status and sent message persistence

### Phase 6 - Public response flow
- token generation
- public route
- accept
- reject
- empty reason normalization
- expiration handling

### Phase 7 - Historical integrity
- snapshot persistence
- history screens
- trust checks

## Deliverables
- working internal budgeting flow
- working WhatsApp delivery flow
- working public token response flow
- trustworthy history

## Exit Criteria
- multi-dog budget can be created and sent
- client can accept or reject
- expired budgets behave correctly
- historical budget meaning remains stable