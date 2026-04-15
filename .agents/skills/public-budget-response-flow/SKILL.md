# public-budget-response-flow

## Purpose

Implement the public token-based response flow for sent budgets.

## Use this skill when
- creating public token routes
- validating token access
- accepting a budget
- rejecting a budget
- handling expiration
- blocking duplicate responses

## Core rules
- Public access is token-based
- Token must be unique and non-guessable
- Only valid sent budgets can be accepted/rejected
- Empty rejection reason becomes `sin motivo`
- Expired budgets cannot be acted on
- Public flow does not require authentication

## Deliverables
- token resolution
- public response page
- accept action
- reject action
- expired state handling
- duplicate response protection

## Do not use this skill for
- internal admin CRUD
- budget cost calculation
- WhatsApp delivery implementation