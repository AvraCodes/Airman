# AI Usage Disclosure

1. Yes. AI was used to accelerate scaffolding, RBAC flow shaping, and docs drafting.
2. AI generated initial file scaffolds, endpoint patterns, and test outlines.
3. All business rules, transitions, and permissions were reviewed and adjusted manually.
4. Rejected suggestion: permitting sortie close after landing without CFI approval; rejected because assessment requires CFI gate.
5. Personally designed: domain model, transition matrix, and required test mapping.
6. Least confident: frontend UX polish and production auth hardening.
7. Backend function explained: `release_sortie` checks role, sortie state, aircraft readiness, mutates state, commits, then writes immutable audit trail.
8. Frontend component explained: `SortieBoard` loads sorties on mount, renders list, triggers release action, refreshes data, and surfaces error state.
