# CLAUDE.md

This file gives Claude Code guidance when working in this repository.
Follow these instructions whenever you inspect, plan, implement, test,
or review changes in this project.

# Project Context

## Project Overview

Build a modern, responsive clothing webshop for browsing apparel and
purchasing products online. The working project name is **Threadline**;
keep branding and copy easy to change later.

The goal is to build a realistic, maintainable full-stack learning
project---not a production-ready commerce platform by pretending
unfinished features are complete. Prioritize a clear customer journey,
reliable product and cart behavior, accessibility, security, and code
the student can understand and explain.

The primary audience is customers shopping for clothing on desktop and
mobile. The initial storefront language may be English, but keep visible
copy centralized and straightforward to translate to Estonian later if
needed. Do not invent legal policies, shipping promises, discounts,
stock levels, product claims, or business details.

## Product Scope

### Core customer features

-   Home page with a clear brand introduction, featured products, and
    links to product categories.
-   Product listing page with product cards, category navigation, and
    useful empty/loading/error states.
-   Product detail page with images, name, description, price, available
    sizes, and stock/availability information when that data exists.
-   Clothing variants such as size and, where relevant, color.
-   Filtering and sorting that behave consistently and can be shared in
    the URL when practical.
-   Shopping cart with add, remove, quantity update, and subtotal
    calculation.
-   Cart persistence suitable for the current architecture. Do not imply
    that a client-side cart is a confirmed order.
-   Checkout form with validated customer and delivery details.
-   Order creation with server-side validation and a clear confirmation
    state.
-   Basic informational pages such as About, Contact, Shipping/Returns,
    and Privacy only when their content can be stated accurately.
-   Responsive navigation, mobile menu, accessible controls, and useful
    feedback after actions.

### Admin features

Do not build an admin dashboard until the customer storefront and data
model are stable and the task is approved. If admin functionality is
later requested, require real authentication and server-side
authorization for every privileged operation. Hiding an admin link in
the UI is not access control.

### Explicitly out of scope unless requested and properly configured

-   Real payment processing or storing card details.
-   Production deployment, real customer data, or live order
    fulfillment.
-   Email delivery, shipping-provider integrations, analytics, reviews,
    wish lists, and loyalty programs.
-   Multi-warehouse inventory, complex tax calculations, or
    multi-currency pricing.
-   Fake authentication or security controls that merely look real.

For early development, use clearly labeled demo data and a test checkout
flow. Before enabling real commerce, explain what additional services,
legal requirements, configuration, testing, and security review are
needed.

# Core Workflow Rules

-   **Always present a written plan and wait for approval before
    beginning any multi-step task.**
-   For a small, clearly scoped, single-step request, briefly state what
    you will change before doing it when useful.
-   Do not start implementation for a multi-step request until the user
    explicitly approves the plan.
-   Plans must identify the goal, files or areas likely to change,
    implementation steps, verification steps, and any important
    assumptions or risks.
-   If requirements are ambiguous and the choice affects architecture,
    security, data, or user experience, ask concise clarifying questions
    before planning implementation.
-   Do not overwhelm the student with many questions at once. Ask only
    the questions needed to make the next safe decision.
-   Prefer small, reviewable changes over large rewrites. After each
    approved stage, summarize what changed, why, and how it was checked.
-   Do not silently add features, dependencies, services, or scope
    beyond the approved plan.
-   Do not overwrite or delete user work without explicit approval.
    Inspect existing files and preserve established project conventions.
-   Before running destructive commands, database resets, migrations
    that may lose data, or broad automated edits, explain the
    consequences and ask for approval.
-   Never claim a command, test, build, migration, deployment, or
    integration succeeded unless you actually ran it and observed the
    result.
-   If a command cannot be run, say so and give the user the exact next
    step to verify it.
-   Explain important decisions in beginner-friendly language. The
    student should be able to explain the code to a teacher rather than
    relying on generated code they do not understand.
-   When presenting commands, say which terminal or directory they
    should be run in if that is not obvious.

## Planning and approval format

For any multi-step task, start with:

1.  **Goal** --- what the task will achieve.
2.  **Assumptions / questions** --- unresolved details that matter.
3.  **Plan** --- numbered implementation steps.
4.  **Files and dependencies** --- expected files or packages, if known.
5.  **Verification** --- how we will test the result.
6.  **Risks** --- only meaningful risks, such as schema changes or
    security impact.

End by asking the user to approve the plan or request changes. Wait for
approval before implementation.

# Technical Baseline

Use the stack already present in the repository when it is coherent.
Inspect `package.json`, the lockfile, directory structure, and existing
conventions before proposing changes. Do not replace tools just because
another option is fashionable.

Preferred baseline for a new project, subject to user/teacher
requirements:

-   Next.js with the App Router.
-   TypeScript with strict checking enabled.
-   React and server components by default.
-   Tailwind CSS for styling if already configured or approved.
-   PostgreSQL for persistent relational data when a database is
    required.
-   Prisma as the ORM if approved and compatible with the installed
    versions.
-   A schema-validation library such as Zod for untrusted inputs if
    already present or approved.
-   A maintained authentication provider/library if authentication
    becomes necessary.
-   A maintained payment provider integration only if real payments are
    explicitly in scope.

Use the package manager indicated by the existing lockfile. Do not mix
npm, pnpm, yarn, and bun in the same project. Do not upgrade Next.js or
major dependencies as an incidental part of an unrelated task.

Do not assume that any package, database, environment variable, external
account, or command-line tool is installed. Check first and explain
setup requirements.

# Architecture and Code Organization

-   Follow the existing App Router structure. Do not introduce the Pages
    Router into an App Router project unless explicitly required.
-   Keep routes and layouts in `app/`.
-   Use Server Components by default. Add `"use client"` only when
    browser APIs, local interaction state, or client-side event handlers
    are required.
-   Keep client components as small as practical. Do not move an entire
    page to the client just to support one interactive control.
-   Put reusable UI in a consistent component directory, such as
    `components/`.
-   Put shared types and pure helpers in clearly named modules, such as
    `types/` and `lib/`, following existing conventions.
-   Keep database access and business rules on the server. Never import
    server-only database code into client components.
-   Use route handlers or Server Actions where appropriate, with
    explicit input validation and authorization. Do not create endpoints
    without a clear need.
-   Avoid giant components, duplicate business logic, unnecessary
    abstraction, and circular imports.
-   Prefer descriptive names and straightforward code over clever
    shortcuts.
-   Do not create multiple competing sources of truth for product
    prices, stock, or order totals.
-   Do not store secrets in source code, committed files, browser
    bundles, or public environment variables.

# Storefront Design and UX

-   Aim for a polished, contemporary clothing-store experience: strong
    product photography, readable typography, consistent spacing, clear
    hierarchy, and restrained visual styling.
-   Keep the interface responsive from small mobile screens through
    desktop.
-   Use real assets only when available and appropriately licensed. Do
    not reference made-up image paths or assume remote image hosts are
    configured.
-   If using remote images, verify the source and configure Next.js
    image handling as required. Provide sensible fallbacks when images
    are missing.
-   Product cards should show useful information such as image, product
    name, price, and an optional category or availability indicator when
    supported by data.
-   Product detail pages must clearly indicate when a size is required
    or unavailable.
-   Buttons must perform the action their labels promise. Avoid fake
    links, dead buttons, and decorative controls that appear functional.
-   Provide loading, empty, success, and error states for important
    interactions.
-   Use accessible HTML elements and meaningful labels. Do not use
    clickable `div` elements when a button or link is appropriate.
-   Ensure keyboard navigation, visible focus states, adequate contrast,
    and useful alternative text for meaningful images.
-   Avoid excessive animations, popups, carousels, or decorative effects
    that interfere with shopping.
-   Do not use fake urgency messages such as "Only 2 left!" unless the
    inventory data actually supports them.
-   Do not invent customer reviews, ratings, testimonials, sales counts,
    or brand partnerships.

# Data Model and Commerce Rules

The data model should remain as simple as possible while representing
clothing products correctly. Agree on the schema before adding a
database or making migrations.

Potential entities, only as needed:

-   **Product:** stable ID, slug, name, description, price in the
    smallest currency unit, currency, images, category relation,
    publication status, and timestamps.
-   **Category:** stable ID, name, slug, and optional description.
-   **ProductVariant:** product relation, size, optional color, SKU if
    needed, and available quantity or a clearly defined availability
    state.
-   **Cart:** either a well-defined client-side cart for a demo or a
    server-backed cart if the approved design requires it.
-   **Order:** stable ID, status, customer/delivery details, line items,
    totals, currency, and timestamps.
-   **OrderItem:** product/variant reference plus snapshots of product
    name, SKU/variant description, and unit price at order time.

These are suggestions, not permission to implement all entities
immediately.

Rules:

-   Store money as integer minor units (for example, cents) or use a
    suitable decimal representation with a clearly defined conversion
    strategy. Never rely on floating-point arithmetic for authoritative
    order totals.
-   Store a currency code explicitly. Do not assume every future price
    is in euros merely because the initial shop may target Estonia.
-   Validate sizes, variants, quantities, and product availability on
    the server.
-   Recalculate prices, discounts, shipping, and totals on the server.
    Never trust totals sent by the browser.
-   Check stock at the point of order creation and define how stock is
    reserved or decremented before implementing real orders.
-   Preserve order-item price/name snapshots so later product edits do
    not rewrite historical order details.
-   Use database constraints and transactions where appropriate for data
    integrity.
-   Use migrations for schema changes and inspect migration output
    before applying it to a database with valuable data.
-   Do not seed production databases with demo data or delete existing
    data as a convenience.
-   Clearly label demo products and demo checkout behavior.

# Security and Privacy

Treat all browser input, query parameters, form submissions, uploaded
files, and external API responses as untrusted.

-   Validate inputs on the server, including type, length, format,
    quantity limits, and allowed enum values.
-   Enforce authorization on the server for every protected action.
-   Use parameterized queries or the ORM's safe query APIs; never
    concatenate untrusted strings into SQL.
-   Do not expose environment variables, secrets, private customer
    information, stack traces, or internal error details to the browser.
-   Never store raw passwords or payment-card details. If accounts are
    introduced, use a reputable authentication solution and its
    recommended password/session handling.
-   Use secure, HTTP-only, appropriately configured cookies for
    sensitive sessions when applicable.
-   Apply appropriate rate limiting and abuse protection before exposing
    sensitive endpoints publicly.
-   Avoid logging passwords, tokens, full payment details, or
    unnecessary personal data.
-   Collect only customer data needed for the approved checkout flow and
    protect it appropriately.
-   Do not claim that the application is legally compliant,
    production-secure, or ready to accept real payments without an
    appropriate review.
-   Keep `.env*` files containing secrets out of version control. Commit
    a `.env.example` with placeholder values only.
-   Use `NEXT_PUBLIC_` only for values that are intentionally public.
    Never use it for secrets.
-   If a security-sensitive requirement is unclear, stop and explain the
    concern before implementing it.

# Authentication, Checkout, and Payments

-   Do not invent a custom authentication system when a maintained
    solution is suitable.
-   If authentication is not required for the school assignment, prefer
    guest checkout or a demo flow over unnecessary account complexity.
-   Checkout must clearly distinguish a demo order from a real order.
-   Do not show a "payment successful" message unless a trusted payment
    result confirms it. In a demo, explicitly label the outcome as
    simulated.
-   Never treat a redirect alone as proof that payment succeeded.
-   For real payments, use a reputable provider's server-side
    integration and verified webhooks, and follow its current
    documentation.
-   Never store card numbers, security codes, or raw payment
    credentials.
-   Explain that real payments require provider configuration, secrets,
    webhook setup, testing, and additional operational responsibilities.

# Error Handling and Observability

-   Handle expected failures gracefully and show clear, non-sensitive
    messages to users.
-   Keep detailed diagnostic information in server logs where
    appropriate, but do not expose secrets or personal data.
-   Do not silently swallow errors or return fake successful responses.
-   Use appropriate HTTP status codes for route handlers.
-   Make empty, loading, not-found, and failure states explicit.
-   When debugging, reproduce the error if possible, inspect the
    relevant code and logs, identify the likely cause, and make the
    smallest reasonable fix.
-   Do not "fix" a problem by disabling type checking, linting,
    validation, or security controls.

# Testing and Quality Gates

Use the checks supported by the actual repository. Inspect
`package.json` before assuming scripts exist.

As appropriate, run:

-   TypeScript checks, such as `npx tsc --noEmit`, if TypeScript is
    configured.
-   The project's lint script.
-   Relevant unit or integration tests if configured.
-   A production build, such as the existing build script, after
    meaningful changes when practical.
-   Manual browser testing for core user journeys.

For the initial storefront, prioritize checking:

-   The home page and product listing load.
-   Product detail links work and unknown product slugs show a useful
    not-found state.
-   Product filters and sorting behave as described.
-   Selecting a clothing size works and unavailable variants cannot be
    added.
-   Cart add/remove/quantity changes produce correct totals.
-   Invalid quantities and malformed form inputs are rejected.
-   Checkout cannot trust a client-supplied price or total.
-   Loading, empty, and error states are usable.
-   Mobile layout and keyboard navigation are reasonable.

Do not claim tests passed unless they were actually run. Report failures
honestly and distinguish existing failures from changes introduced by
the current task.

# Git and Change Management

-   Inspect `git status` before editing if the repository uses Git.
-   Do not discard, reset, or overwrite uncommitted user changes.
-   Keep changes focused and reviewable.
-   After each major feature or milestone is implemented and its checks
    (type check, lint, build) pass, commit and push it to `origin`
    (https://github.com/janarialtdorf/claude_test2, branch `main`) using
    Conventional Commits messages (`feat:`, `fix:`, `docs:`,
    `refactor:`, `chore:`). Do not commit half-finished or failing work.
-   Otherwise, do not create commits, push to a remote, deploy, or
    publish without the user's explicit request.
-   Never place secrets, real customer data, database dumps, or private
    keys in commits.
-   If asked to commit, summarize the intended changes and check the
    staged diff first.

# Dependencies and External Services

-   Prefer existing dependencies over adding new ones.
-   Before adding a dependency, explain why it is needed, whether a
    built-in feature can solve the problem, and any meaningful setup or
    maintenance implications.
-   Do not install packages, change major versions, create cloud
    resources, or connect paid services without approval.
-   Use official documentation for version-sensitive Next.js, Prisma,
    database, authentication, and payment behavior.
-   Do not fabricate API methods or configuration keys. Verify
    unfamiliar APIs against installed types or current official
    documentation.
-   If external service credentials are required, explain where to
    obtain them and how to configure them safely. Never ask the user to
    paste secrets into chat.

# Environment and Local Development

-   Read the existing README and package scripts before changing setup
    instructions.
-   Explain which directory a command must run in.
-   Keep local setup reproducible and document required environment
    variables in `.env.example` using placeholders.
-   Do not assume a database server is running or that a cloud database
    already exists.
-   If a database is not yet configured, discuss the simplest suitable
    option before adding database-specific code.
-   Do not run destructive database commands without explaining the
    impact and receiving approval.
-   Keep setup documentation updated when installation or configuration
    steps change.

# Documentation and Student Learning

This is a learning project. Make it easier for the student to understand
and defend the work.

-   Explain the purpose of important files, architectural choices, and
    non-obvious code.
-   When a task introduces a new concept, give a concise explanation
    before or alongside implementation.
-   Avoid generating an enormous code dump when a few incremental
    changes are easier to understand.
-   After each approved implementation stage, summarize:
    -   What changed.
    -   Which files matter.
    -   How to run or test it.
    -   What the student should understand.
    -   What remains unfinished.
-   Keep README setup steps accurate and beginner-friendly.
-   Distinguish implemented features from planned features.
-   Do not describe a mock feature as a real integration.
-   Encourage the student to run commands, inspect changes, test
    behavior, and ask questions rather than blindly accepting generated
    code.

# Definition of Done

A task is complete only when:

-   The approved scope has been implemented without unrelated extras.
-   Relevant checks have been run, or unrun checks are explicitly
    disclosed.
-   Important failure and empty states have been considered.
-   No secrets or unintended private data were introduced.
-   The student receives a concise summary of changes and verification.
-   Any known limitations or next steps are stated honestly.

A feature is not complete merely because its UI looks finished.

# First Task Guidance

When starting work in a new or existing repository:

1.  Inspect the current directory, repository status, file tree,
    `package.json`, README, and existing project conventions.
2.  Do not modify files during the initial inspection.
3.  Ask for the teacher's assignment brief if available, and identify
    any required features, submission format, or restrictions.
4.  Summarize the current project state and identify missing setup
    prerequisites.
5.  Propose a small first milestone, such as creating a basic storefront
    shell with sample products.
6.  Present a written plan and wait for approval before implementing it.

If the repository is empty, do not immediately install a full commerce
stack. First confirm the assignment constraints and propose the smallest
appropriate starting setup.
