# AGENTS.md

# Inventory Tracker — AI Agent Guide

> This document provides implementation guidance for AI coding agents and contributors working on the Inventory Tracker project. It defines architecture, coding standards, development workflow, and project conventions. Follow this document alongside `docs/PRD.md`.

---

# Project Overview

Inventory Tracker is a modern web application built for retail businesses selling fashion accessories such as:

- Wristwatches
- Glasses
- Bags
- Wallets
- Belts
- Shoes
- Men's Accessories
- Other Fashion Accessories

The application helps business owners manage products, inventory, suppliers, sales, reports, and users from a centralized dashboard.

This is an MVP-first project designed with scalability in mind.

---

# Primary Objective

Build a clean, scalable, maintainable inventory management system that prioritizes:

- Simplicity
- Performance
- Reliability
- Security
- Extensibility

Every implementation should favor long-term maintainability over quick fixes.

---

# Tech Stack

## Frontend

- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui
- Lucide Icons
- TanStack Query
- Zustand
- React Hook Form
- Zod
- TanStack Table
- Recharts
- Sonner

---

## Backend

Supabase

Use:

- Authentication
- PostgreSQL Database
- Storage
- Row Level Security
- Edge Functions when necessary

---

## ORM

Drizzle ORM

Do not use Prisma unless there is a compelling reason to migrate.

---

## Deployment

Frontend

- Vercel

Backend

- Supabase Cloud

---

# Development Philosophy

Always prioritize:

1. Readability
2. Type Safety
3. Performance
4. Accessibility
5. Scalability

Avoid unnecessary abstractions.

Keep components focused.

Keep business logic outside UI components whenever possible.

---

# Folder Structure

```
app/

components/
    ui/
    shared/
    dashboard/
    inventory/
    products/
    sales/

features/
    auth/
    dashboard/
    inventory/
    products/
    reports/
    sales/
    suppliers/

lib/
    db/
    auth/
    utils/
    validations/

hooks/

services/

types/

constants/

public/
```

---

# Feature Modules

Each feature should contain:

```
feature/

components/

hooks/

services/

types/

validations/

utils/
```

Avoid creating extremely large files.

---

# UI Principles

The interface should feel like modern business software.

Inspired by:

- Linear
- Stripe Dashboard
- Notion
- Vercel Dashboard

Characteristics:

- Minimal
- Spacious
- Professional
- Fast
- Data-first

Avoid unnecessary decoration.

---

# Color Philosophy

Neutral interface.

Accent color only for actions.

Success

Warning

Danger

Info

must all follow semantic color usage.

Never use random colors.

---

# Component Rules

Components should:

- Be reusable
- Be composable
- Accept props
- Avoid duplicated logic

Never create page-specific UI inside shared components.

---

# State Management

Use:

Local state

→ React state

Server state

→ TanStack Query

Global UI state

→ Zustand

Do not store server data in Zustand.

---

# Forms

Always use

React Hook Form

+

Zod

Validation should exist both:

Frontend

Backend

---

# Database Principles

Normalize data.

Avoid duplicated information.

Use foreign keys.

Never store derived values unless required for performance.

Inventory quantity should always be calculated through stock movements or maintained through transactional updates.

---

# Naming Conventions

Components

```
ProductCard.tsx

InventoryTable.tsx

SalesChart.tsx
```

Hooks

```
useProducts.ts

useInventory.ts
```

Services

```
product.service.ts

inventory.service.ts
```

Validation

```
product.schema.ts

sales.schema.ts
```

Types

```
product.types.ts
```

---

# Database Tables

Core tables

- users
- roles
- categories
- products
- suppliers
- inventory
- stock_movements
- sales
- sale_items
- customers

Future tables

- purchase_orders
- purchase_items
- notifications
- activity_logs
- branches

---

# Authentication

Use Supabase Auth.

Roles

Owner

Manager

Staff

Every protected route must verify permissions.

---

# Inventory Rules

Every inventory operation creates a Stock Movement.

Examples

Stock In

Stock Out

Sale

Adjustment

Return

Never directly change stock quantity without recording the reason.

Stock history is critical.

---

# Product Rules

Each product should support:

- Image
- SKU
- Category
- Brand
- Cost Price
- Selling Price
- Quantity
- Low Stock Threshold
- Description
- Status

Future support:

Variants

Barcode

QR Code

---

# Sales Rules

A sale:

Creates Sale record

Creates Sale Items

Reduces Inventory

Creates Stock Movement

Everything happens in one transaction.

Never partially save a sale.

---

# Error Handling

Never silently ignore errors.

Display friendly messages.

Log unexpected errors.

Return typed responses.

---

# Performance

Lazy-load heavy components.

Paginate tables.

Use Server Components where appropriate.

Use Client Components only when interactivity is required.

Cache server requests when possible.

Avoid unnecessary re-renders.

---

# Accessibility

Every form field requires:

- Label
- Description where needed
- Keyboard support
- Proper focus states

Buttons should never rely solely on color.

---

# Security

Always validate input.

Never trust frontend data.

Enable Row Level Security.

Protect API routes.

Escape user-generated content.

---

# Git Workflow

Branch naming

```
feature/product-management

feature/dashboard

feature/inventory

fix/login

refactor/database
```

Commit format

```
feat:

fix:

refactor:

style:

docs:

test:

chore:
```

Example

```
feat: add stock movement history

fix: resolve duplicate SKU validation

refactor: simplify dashboard queries
```

---

# Coding Style

Prefer

Early returns

Small functions

Pure functions

Typed interfaces

Readable names

Avoid

Magic numbers

Deep nesting

Huge files

Duplicate logic

---

# Testing Checklist

Before marking a task complete verify:

 Product can be created

 Product can be edited

 Product can be archived

 Stock updates correctly

 Sales reduce inventory

 Reports calculate correctly

 Permissions work

 Forms validate properly

 Mobile layout works

 No TypeScript errors

 No ESLint warnings

---

# MVP Priority

Build in this order:

1. Authentication

2. Dashboard

3. Categories

4. Products

5. Inventory

6. Stock Movements

7. Sales

8. Suppliers

9. Reports

10. Settings

Future features should only begin after the MVP is stable.

---

# AI Agent Guidelines

When implementing features:

- Read the relevant documentation in `/docs` before writing code.
- Reuse existing components and utilities instead of duplicating logic.
- Keep business logic in services or server actions, not UI components.
- Preserve type safety across the stack.
- Update documentation when introducing new architecture or database changes.
- If a requested implementation conflicts with the PRD, explain the trade-offs and propose an alternative rather than silently deviating.

When unsure, choose the solution that is simpler, more maintainable, and easier to extend.
