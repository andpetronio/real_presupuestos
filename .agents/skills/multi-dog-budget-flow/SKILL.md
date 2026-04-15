# multi-dog-budget-flow

## Purpose

Implement the internal workflow for creating, previewing, editing, and sending budgets that may include more than one dog.

## Use this skill when
- creating the budget workflow
- adding/removing dogs from a budget
- assigning recipes and days per dog
- building preview
- enabling edit-before-send
- managing internal budget states

## Core rules
- A budget may include one or more dogs
- Each dog has its own recipe assignments and requested days
- Preview must be human-friendly
- Budget can be edited before send
- Budget totals must remain consistent with calculation services
- Internal state transitions must be explicit

## Deliverables
- budget draft flow
- per-dog breakdown flow
- editable preview
- transition to ready-to-send
- integration with WhatsApp send action

## Do not use this skill for
- generic CRUD
- token public accept/reject
- provider-specific WhatsApp transport implementation