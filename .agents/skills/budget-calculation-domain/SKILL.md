# budget-calculation-domain

## Purpose

Implement and protect the business calculation logic for personalized meal-plan budgets.

## Use this skill when
- calculating raw material unit cost
- calculating recipe cost
- calculating per-dog budget cost
- calculating full budget total
- applying margin formula
- preparing snapshot-ready results

## Core rules
- Daily intake belongs to the dog
- Recipes belong to dogs
- Recipe items are stored as daily quantities
- Budgets can include multiple dogs
- Cost must be calculated per dog and then aggregated
- Sale price formula is `PV = CT / (1 - margin)`
- Historical calculation context must be preservable

## Deliverables
- server-side calculation services
- validation of calculation preconditions
- structured result DTOs or equivalent payloads
- snapshot-ready result structures

## Do not use this skill for
- page layout
- CRUD screens
- public token route handling
- actual WhatsApp delivery calls