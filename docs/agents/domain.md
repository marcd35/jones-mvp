# Domain Docs

How the engineering skills should consume this repo's domain documentation.

## Before exploring, read these

- `CONTEXT.md` at the repo root.
- `docs/adr/` for decisions that affect the area being changed.

If a file or directory does not exist, proceed silently. `/domain-modeling` creates these lazily when terms or decisions are resolved.

## File structure

This is a single-context repo:

- `CONTEXT.md` is the root glossary.
- `docs/adr/` holds system-wide decisions.

## Use the glossary's vocabulary

Use terms as defined in `CONTEXT.md`. If a concept is missing, note it for `/domain-modeling`.

## Flag ADR conflicts

If proposed work contradicts an ADR, surface that conflict rather than silently overriding the decision.
