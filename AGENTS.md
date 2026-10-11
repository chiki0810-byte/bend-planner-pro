# AGENTS.md

- Open-piece domain model lives in `src/lib/piezaAbierta.ts` (segments and bends as separate collections, N segments ⇔ N-1 bends, mandatory dimension reference reused from `profileTypes.ts`); it holds structure only — calculations stay in `bendCalc.ts`, so formulas have a single source.
