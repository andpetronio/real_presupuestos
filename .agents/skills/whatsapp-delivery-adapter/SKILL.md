# whatsapp-delivery-adapter

## Purpose

Implement the outgoing WhatsApp delivery layer for budgets using a provider adapter pattern.

## Use this skill when
- defining sender configuration
- building outgoing budget messages
- allowing message editability before send
- integrating a WhatsApp provider
- persisting the message actually sent
- handling delivery failures

## Core rules
- Delivery must target the tutor's WhatsApp number
- Sender configuration must be externalized
- Message should be editable before send
- The final sent message must be stored
- Delivery implementation must be replaceable through an adapter
- Provider-specific logic must not leak into the whole app

## Deliverables
- provider adapter interface
- message builder integration
- send action
- storage of message draft and sent message
- delivery error surface

## Do not use this skill for
- budget formulas
- public token accept/reject
- standard CRUD screens