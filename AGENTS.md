# AGENTS.md

- Open-piece domain model lives in `src/lib/piezaAbierta.ts` (segments and bends as separate collections, N segments ⇔ N-1 bends, mandatory dimension reference reused from `profileTypes.ts`); it holds structure only — calculations stay in `bendCalc.ts`, so formulas have a single source.
- BendCalculator tracks explicit R/K edits per current material/thickness and resets provenance on combination changes or restored inputs; computeBend accepts absent defaults only with valid explicit R/K, preventing invented fallback calibration.
