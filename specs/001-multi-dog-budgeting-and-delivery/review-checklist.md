# Review Checklist - 001 Multi Dog Budgeting and Delivery

## Foundation
- [ ] The implementation follows the SvelteKit foundation spec
- [ ] Supabase is the primary data backend
- [ ] Internal authentication is protected
- [ ] Public token flow is separate from authenticated app routes

## Tutors and Dogs
- [ ] Tutors can be created and edited
- [ ] Dogs belong to tutors
- [ ] Dogs store daily intake
- [ ] Dogs can have multiple recipes

## Recipes
- [ ] Recipes belong to a dog
- [ ] Recipe items store daily quantities
- [ ] Recipe creation no longer times out
- [ ] Recipe UI is responsive enough for normal use

## Budgets
- [ ] A budget can include more than one dog
- [ ] Each budget dog can include one or more recipes
- [ ] Assigned recipe days work per dog
- [ ] Operational inputs are supported
- [ ] Totals per dog are correct
- [ ] Budget total is correct

## Preview
- [ ] Preview is human-friendly
- [ ] Preview is not technical JSON
- [ ] Preview shows dogs, days, costs, totals, and validity clearly
- [ ] Preview supports returning to edit flow

## Editing
- [ ] Budget can be edited before send
- [ ] Draft and ready-to-send states behave correctly

## WhatsApp Delivery
- [ ] Tutor WhatsApp number is used for delivery
- [ ] Sender configuration is available
- [ ] Message can be edited before send
- [ ] Sent message is stored

## Public Flow
- [ ] Public token is unique and non-guessable
- [ ] Public page resolves correct budget
- [ ] Client can accept valid budget
- [ ] Client can reject valid budget
- [ ] Empty reject reason becomes `sin motivo`
- [ ] Expired budget is blocked correctly

## History
- [ ] Historical snapshot exists
- [ ] Historical view does not depend on current live costs
- [ ] Sent message and response state remain traceable

## Scope Guard
- [ ] No inventory module was introduced
- [ ] No PDF module was introduced
- [ ] No generic arbitrary manual cost system was introduced
- [ ] No customer portal beyond token flow was introduced