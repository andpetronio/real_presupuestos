# 001 - Multi Dog Budgeting and Delivery

## Status
Approved for implementation

## Owner
Product / Operations

## Purpose

Define the MVP for a budgeting system for personalized pet meal plans, built as a new SvelteKit application from scratch.

This version supersedes the previous single-dog budget assumption.

A budget may now include one or more dogs.

## Product Goal

Build an MVP that allows the business to:

- manage tutors
- manage dogs
- manage raw materials
- manage recipes per dog
- create budgets that may include one or more dogs
- calculate ingredient and operational costs
- generate a human-friendly preview
- edit the budget before sending
- send the budget by WhatsApp
- allow the client to accept or reject through a unique link
- handle expiration correctly
- preserve trustworthy historical records

## Actors

### Internal operator
Can:
- manage master data
- build and edit budgets
- preview budgets
- send budgets
- track statuses and history

### Tutor / client
Can:
- receive the budget by WhatsApp
- open a public link
- accept or reject the budget
- optionally provide a rejection reason

## Scope

## In scope for MVP

- Tutors management
- Dogs management
- Raw materials management
- Recipes management
- Multiple recipes per dog
- Budgets with one or more dogs
- Cost calculation per dog
- Total calculation at budget level
- Manual operational inputs
- Human-friendly preview
- Edit-before-send workflow
- WhatsApp delivery integration
- Editable outgoing message
- Unique public token link
- Public accept/reject flow
- Expiration handling
- Budget history
- Historical snapshot persistence

## Explicitly out of scope for MVP

- Inventory / stock
- Purchasing workflows
- Production planning
- Supplier management
- Generic arbitrary manual cost items
- PDF generation
- Customer full portal
- Promotions / coupons / discounts
- Realtime collaboration
- Native mobile app

## Core Product Changes Incorporated

This feature set explicitly includes the following changes:

- a budget can include more than one dog
- preview must be human-friendly
- a budget must be editable before being sent
- WhatsApp delivery must be real delivery, not only link-opening
- the WhatsApp message should be editable
- the public token link must be correct and reliable

## Core Business Rules

### BR-001 - A tutor can have many dogs
A tutor may have one or more dogs.

### BR-002 - Daily intake belongs to the dog
Each dog stores its daily food intake.

### BR-003 - Recipes belong to dogs
A recipe belongs to one dog.

### BR-004 - A dog may have multiple recipes
A dog can have one or more recipes.

### BR-005 - Recipe items are daily quantities
Recipe items are defined by explicit daily quantity, not by percentages as the primary stored truth.

### BR-006 - A budget may include one or more dogs
A budget is no longer restricted to a single dog.

### BR-007 - Each budget dog may have one or more recipes
Inside a budget, each included dog may have one or more recipes assigned.

### BR-008 - Assigned recipe days are per dog
For each dog inside the budget, recipe participation is modeled through assigned days.

### BR-009 - Requested days are defined per dog entry
Each dog included in the budget has its own requested day count.

### BR-010 - Supported operational inputs are explicit
For MVP, supported manual operational inputs are:
- vacuum bags quantity
- labels quantity
- non-woven bags quantity
- labor hours quantity
- cooking hours quantity

### BR-011 - Total cost is composed of ingredient plus operational cost
For each dog:
- ingredient total
- operational total
- dog subtotal

For the full budget:
- sum of dog subtotals = budget total cost

### BR-012 - Sale price formula
Use:

`PV = CT / (1 - margin)`

Where:
- PV = sale price
- CT = total cost
- margin = configured meal plan margin

### BR-013 - Preview must be operator-friendly
Preview must not be raw JSON or a technical dump.
It must be readable by a non-technical operator.

### BR-014 - A budget can be edited before sending
While the budget remains unsent, the operator must be able to edit it.

### BR-015 - WhatsApp delivery is a real send operation
The budget must be sent to the tutor’s WhatsApp number through a messaging adapter.

### BR-016 - Outgoing message is editable
The operator must be able to edit the message before sending.

### BR-017 - Unique public link
Each sent budget must have a unique, non-guessable public token.

### BR-018 - Public accept
If valid, a client can accept the budget.

### BR-019 - Public reject
If valid, a client can reject the budget and optionally provide a reason.

### BR-020 - Empty reject reason
If no reason is provided, store `sin motivo`.

### BR-021 - Expiration
A budget stores:
- `created_at`
- `expires_at`

Where `expires_at = created_at + configured validity days`.

### BR-022 - Expired behavior
If the client opens the link after expiration:
- show expired state
- invite requesting a new budget
- do not allow accept/reject
- state becomes `expired`

### BR-023 - Historical snapshot is mandatory
Historical budgets must preserve the calculation context used when they were created/sent.

## Budget States

- `draft`
- `ready_to_send`
- `sent`
- `accepted`
- `rejected`
- `expired`
- `discarded`

## State Semantics

### draft
Budget is being composed.

### ready_to_send
Budget is valid, previewable, and ready for send, but not yet sent.

### sent
Budget was sent to the tutor.

### accepted
Tutor accepted through public token flow.

### rejected
Tutor rejected through public token flow.

### expired
Budget validity passed.

### discarded
Internal non-active state.

## Suggested Data Model

## tutors
- id
- full_name
- whatsapp_number
- notes
- created_at
- updated_at

## dogs
- id
- tutor_id
- name
- daily_food_intake
- intake_unit
- notes
- is_active
- created_at
- updated_at

## raw_materials
- id
- name
- base_unit
- purchase_quantity
- purchase_unit
- purchase_cost
- derived_unit_cost
- is_active
- created_at
- updated_at

## recipes
- id
- dog_id
- name
- notes
- is_active
- created_at
- updated_at

## recipe_items
- id
- recipe_id
- raw_material_id
- daily_quantity
- unit
- created_at
- updated_at

## settings / operational parameters
- meal_plan_margin
- budget_validity_days
- vacuum_bag_unit_cost
- label_unit_cost
- non_woven_bag_unit_cost
- labor_hour_cost
- cooking_hour_cost
- whatsapp_sender_number
- whatsapp_default_template

## budgets
- id
- status
- tutor_id nullable if needed for direct business context
- public_token
- created_at
- updated_at
- expires_at
- sent_at
- accepted_at
- rejected_at
- discarded_at
- applied_margin
- total_cost
- final_sale_price
- rejection_reason
- whatsapp_message_draft
- whatsapp_message_sent
- notes

## budget_dogs
- id
- budget_id
- dog_id
- requested_days
- ingredient_total
- operational_total
- total_cost
- final_sale_price
- created_at
- updated_at

## budget_dog_recipes
- id
- budget_dog_id
- recipe_id
- assigned_days
- created_at
- updated_at

## budget_snapshots
- id
- budget_id
- snapshot_payload_json
- created_at

## Internal Flow

1. Select or create tutor
2. Select one or more dogs
3. For each dog:
   - choose requested days
   - assign one or more recipes
   - assign days per recipe
   - enter operational quantities
4. Calculate subtotals per dog
5. Calculate totals for full budget
6. Show human-friendly preview
7. Allow edits
8. Allow message editing
9. Send budget by WhatsApp
10. Mark as sent

## Public Flow

1. Client receives WhatsApp with message and unique link
2. Client opens public token page
3. If valid:
   - can accept
   - can reject
4. If expired:
   - sees expired message
   - cannot respond

## Acceptance Criteria

### AC-001
An operator can create a budget including more than one dog.

### AC-002
Each dog in a budget can have one or more assigned recipes.

### AC-003
Budget preview is readable and non-technical.

### AC-004
A budget can be edited before being sent.

### AC-005
The final outgoing WhatsApp message can be edited before send.

### AC-006
The app can send the budget through a WhatsApp delivery adapter.

### AC-007
The public link is unique and non-guessable.

### AC-008
A valid budget can be accepted or rejected publicly.

### AC-009
An empty reject reason becomes `sin motivo`.

### AC-010
Expired budgets are blocked and shown correctly.

### AC-011
Historical budget snapshots preserve the original calculation context.