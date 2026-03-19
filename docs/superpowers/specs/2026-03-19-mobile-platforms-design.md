# Mobile Platforms Design

Date: 2026-03-19
Project: 8-Bit Adventure (React + Canvas)
Status: Approved (Brainstorming)

## 1. Goal

Add moving platforms with an arcade-predictable feel, preserving readability and fairness while integrating with current player/enemy physics.

## 2. Validated Design Decisions

- Feel: arcade and predictable.
- Base trajectory: linear back-and-forth.
- Player interaction: automatic carry while standing on top.
- Endpoint behavior: short pause at each end.
- Default speed tier: medium.
- Default travel range: 200 px between extremes.
- First introduction: horizontal platforms first.
- Crush behavior (player): takes damage and respawns (not instant death).
- Enemy interaction: enemies are transported by moving platforms, but never crushed by them.
- Activation: always active from level start.
- Density: 2 moving platforms per level.
- Jump inertia: keep horizontal momentum when jumping from a moving platform.

## 3. Approaches Evaluated

### A. Minimal integration in `App.jsx`

- Pros: fastest to ship.
- Cons: increases coupling and file growth risk.

### B. Dedicated mobile-platform physics module (selected)

- Pros: better maintainability, cleaner game loop, easier balancing.
- Cons: slightly more setup than A.

### C. Generic moving-entity framework

- Pros: highly scalable for future mechanics.
- Cons: overengineered for current scope.

Selected approach: **B**.

## 4. Architecture

Create a dedicated module (e.g., `mobilePlatforms`) with clear responsibilities:

1. `updateMobilePlatforms(dt, platforms)`
- Updates trajectory, direction switch, and endpoint pause timing.

2. `resolvePlayerOnMobilePlatforms(player, platforms)`
- Detects standing contact and applies automatic carry.
- Preserves momentum transfer on jump.

3. `resolveCrushDamage(player, platforms, world)`
- Detects true compression against static solids.
- Applies damage + respawn flow (non-instant-death behavior).

4. `resolveEnemyPlatformTransport(enemies, platforms)`
- Applies top-surface transport for enemies.
- Explicitly excludes crush logic for enemies.

## 5. Data Model and State

Moving-platform entities in level data should include:

- `kind: "mobile"`
- `axis: "x" | "y"` (initial rollout uses `"x"` first)
- `origin` (start position)
- `range: 200`
- `speed` (medium tier)
- `direction: 1 | -1`
- `pauseMs: 300`
- `pauseTimer`
- `startActive: true`

## 6. Per-Frame Data Flow

1. Update moving platform transforms (position, pause, direction).
2. Resolve player physics against static world.
3. Resolve player-on-platform contact and carry.
4. Resolve player crush checks and damage/respawn.
5. Resolve enemy transport over moving platforms.
6. Render using updated platform positions.

## 7. Edge Cases and Robustness Rules

1. Tunneling on frame spikes:
- Clamp effective movement per frame or sub-step collision updates.

2. Multi-surface contact:
- Apply a single carry source using top-most valid support surface.

3. False crush positives:
- Crush damage requires real compression between moving platform and opposing static solid, with epsilon tolerance.

4. Respawn safety:
- Reset position/velocity and apply short post-hit invulnerability to avoid damage loops.

5. Endpoint pauses:
- During pause timer, platform velocity is zero and carry vector is zero.

6. Coins/enemies interaction:
- Coins remain static.
- Enemies can be transported when supported.

## 8. Testing Strategy

1. Trajectory tests:
- Platform travels 200 px total range.
- Endpoint pause is ~300 ms.
- Direction flips cleanly (no jitter).

2. Player interaction tests:
- Auto-carry works while standing.
- Jump keeps horizontal platform inertia.
- No carry when unsupported.

3. Crush behavior tests:
- Player receives damage and respawns under real crush.
- No damage on side grazes/jitter contacts.
- No immediate repeated post-respawn damage.

4. Enemy behavior tests:
- Enemies are transported correctly.
- Enemies are never crushed by moving platforms.

5. Level-design validation:
- Two moving platforms per level.
- Level 1 introduces horizontal movement first.
- Difficulty remains arcade-predictable.

## 9. Scope Boundaries (YAGNI)

Out of scope for this phase:

- Complex multi-node spline paths.
- Platform-triggered scripting/events.
- Enemy-specific crush/death rules from moving platforms.
- Coin attachment to moving platforms.

## 10. Transition Criteria

This design is approved and ready for implementation planning.
