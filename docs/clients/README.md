# Client-Specific Documentation

This folder contains documentation for each business client, tracking their unique requirements, features, and customizations needed in the Grand Slam Generator system.

## Active Clients

### [MC Racing](./mc-racing.md)
- **Industry**: Sim Racing Entertainment
- **Key Features**: Expense budget tracking, transaction accounting, high-growth targets (300%+)
- **Color**: Blue (#1d4ed8)

### [Monster Remodeling](./monster-remodeling.md)
- **Industry**: Home Remodeling/Construction
- **Key Features**: Material cost tracking per stream, business cost modeling, market intelligence, revenue override mode
- **Color**: Green (#10b981)

## Shared Features

All clients get these standard features:
- Revenue stream breakdown
- Growth target (% or revenue-based)
- Contract lock/unlock
- Projection engine with seasonal adjustments
- Fee calculations (foundation, sustaining, growth)
- Analytics dashboard (demo/live modes)
- How It Works explainer

## Adding a New Client

When adding a new client, create a new markdown file with:
1. Business overview (industry, location, baseline)
2. Unique features required
3. Revenue stream categories
4. Seasonal factors for their industry
5. Contract term variations (if any)
6. UI/UX preferences (colors, branding)
7. Integration requirements
8. Client portal details (if applicable)

## Feature Matrix

| Feature | MC Racing | Monster Remodeling |
|---------|-----------|-------------------|
| Expense Budget | Yes | No |
| Material Costs | No | Yes |
| Transaction Tracking | Yes | No |
| Business Cost Modeling | No | Yes |
| Revenue Override Mode | No | Yes |
| Market Intel Tab | Basic | Detailed |
| Growth % Input | Yes | Yes |
| Revenue Target Input | Yes | Yes |
| Client Portal | Pending | Yes |
