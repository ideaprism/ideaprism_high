# Private school data implementation plan

**Goal:** Load the 325-record package, retain account issuance, and authorize every school data request without Supabase.

**Architecture:** Private filesystem JSON/photos plus a server-only SQLite account store. Existing issued-code login is retained as the account credential; every issued account has a school ID. Signed cookies reference the account and a revocation version, checked against SQLite on every API/page request. No public registration or static school-code bypass.

**Tech Stack:** Next.js 15 / Node.js 22.16+ built-in SQLite / existing React search and KIPRIS views.

1. Add real local-store and route regression tests: issuance, school isolation, anonymous denial, revocation, exclusion and missing photo. Observe failures before implementation.
2. Replace administrator persistence with SQLite; retain issuance, editing, disable/enable, usage counts, overview, and inquiry viewing. Make issuance transactional. Add explicit one-time administrator bootstrap CLI.
3. Bind school sessions to issued accounts; validate active account, school, expiration and session version at every access. Reject old shared-code sessions.
4. Copy package to ignored private storage; validate IDs/counts/catalog/photo paths. Scope data before matching/ranking. Use package catalog and preserve Boolean/natural language search.
5. Serve details and original photos only through authorized endpoints with private/no-store. Add student, original school, award-time grade, missing-image UI.
6. Populate patent terms from package keyword/search_terms/IPC; remove browser Supabase queries. Preserve the editable search and KIPRIS request flow without inventing Simple/Expert data.
7. Run tests, typecheck, production build, local HTTP access matrix and browser flows. Record evidence and operating instructions; no deployment.

Existing working tree was clean. The supplied README is authoritative for data mappings. Remote Supabase data/accounts are not migrated automatically: this task is local-only, and the package has no credentials. SQLite needs a persistent local disk and a Node server; stateless/serverless multi-instance hosting requires a shared account database in a later deployment task.
