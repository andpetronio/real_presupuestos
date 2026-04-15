# Appendix - Functional Notes

## Purpose

Clarify product intent and reduce ambiguity for agents implementing the budgeting MVP.

## 1. Budgets are now multi-dog
This is a foundational rule, not a small patch.

Agents must not model the system as permanently one-budget-one-dog.

## 2. Preview is part of the product
Preview is not a debug output.
It is part of the operator workflow.

It should feel close to:
- a commercial summary
- an understandable quote
- a practical internal review screen

## 3. Edit-before-send is mandatory
The operator must be able to fix the budget before sending it.

That means:
- preview cannot be a dead end
- the workflow must support going back and adjusting data

## 4. WhatsApp sending is real delivery
This MVP is no longer based only on opening a link in WhatsApp.

There must be a delivery adapter capable of sending the final message to the tutor’s WhatsApp number.

The sender configuration may live in environment variables and/or settings.

## 5. Message editability
The operator should not be trapped inside a rigid template.

The product should support:
- a base message template
- a final editable message before send
- storage of the message that was actually sent

## 6. Public link correctness is critical
The public token flow is not decorative.

It must:
- resolve the correct budget
- be non-guessable
- remain stable and usable
- reflect correct budget state

## 7. Historical trust
Historical data must be trustworthy enough that the operator can later understand:
- what was sent
- what was quoted
- what costs were used
- which dogs were included
- what message was sent
- whether the client accepted or rejected

## 8. Timeout lesson from the previous attempt
The old implementation taught a useful lesson:
- avoid heavy reactive logic in forms
- avoid overloading create/edit screens
- avoid mixing calculation truth with UI state
- avoid hidden repeated queries in UI widgets

This new implementation must keep business logic in server-side modules.