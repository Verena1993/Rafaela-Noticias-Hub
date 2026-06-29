# RN Hub — Development Constitution

## Purpose

This document defines the permanent development rules for the RN Hub project.

These rules take precedence over implementation convenience and should be respected during every development session.

---

# 1. Source of Truth

Supabase is the only source of truth.

Never recreate information already stored in the database.

Never replace Supabase with local data.

---

# 2. Mock Data

Forbidden.

Never create:

* mock users
* fake proposals
* fake coverages
* fake categories
* fake organizations
* fake programs
* fake formats
* sample datasets

Never recreate any `INITIAL_*` structure once a module has been migrated.

---

# 3. Silent Fallbacks

Forbidden.

If Supabase fails:

* log the error;
* notify the user;
* keep a consistent application state;
* allow future retry.

Never silently replace database information with localStorage or mock data.

---

# 4. Architecture First

Never start coding immediately.

For every new stage:

1. Analyze.
2. Design.
3. Present architecture.
4. Wait for approval.
5. Implement.

---

# 5. Scope Control

Implement only the approved stage.

Never implement future stages in advance.

Never add "nice to have" features without approval.

---

# 6. UI Stability

Do not modify the UI unless explicitly requested.

Whenever possible:

* keep components unchanged;
* keep props unchanged;
* keep hooks unchanged.

Business logic belongs inside HubContext.

---

# 7. HubContext Responsibilities

HubContext is the adaptation layer.

It is responsible for:

* mapping database models;
* business logic;
* synchronization;
* state management.

React components should consume application models only.

---

# 8. Database Design

Prefer relational models.

Avoid JSONB whenever a relational structure is appropriate.

Always normalize reusable entities.

Examples:

* media
* shared_links
* programs
* formats
* categories

---

# 9. Database Evolution

Every schema change must include:

* RLS policies;
* indexes;
* foreign keys;
* constraints;
* migration strategy.

---

# 10. Error Handling

Never hide errors.

Never fake success.

Show clear messages.

Maintain consistent state.

---

# 11. Documentation

Every completed stage must update:

* walkthrough.md
* task.md

If architecture changes:

* database_architecture.md

If project rules evolve:

* PROJECT_RULES.md

---

# 12. Verification

Every implementation must finish with:

* npm run build

Compilation must complete without TypeScript errors.

---

# 13. Git Workflow

One commit per stage.

One milestone commit per completed milestone.

Commit messages should clearly describe the delivered functionality.

---

# 14. Development Workflow

Architecture

↓

Approval

↓

Implementation

↓

Verification

↓

Documentation

↓

Commit

↓

Push

↓

Next Stage

---

# 15. Long-Term Vision

RN Hub is not a demo project.

RN Hub is a production editorial platform.

Every implementation must prioritize:

* maintainability;
* scalability;
* consistency;
* performance;
* readability.

Short-term shortcuts that compromise future architecture are not acceptable.

---

# 16. Development Principles

When multiple solutions are possible, always prefer the one that:

* reduces technical debt;
* simplifies future maintenance;
* minimizes duplicated code;
* maximizes code reuse;
* preserves compatibility.

---

# 17. User Approval

Never begin the next stage automatically.

Always stop after completing the approved scope.

Wait for explicit approval before continuing.

---

# 18. Versioning

Development is organized into:

* Milestones
* Stages

Every milestone represents a stable evolution of the project.

---

# Final Principle

Build RN Hub as if it will be used daily by a professional newsroom for many years.

Every technical decision should support that goal.
