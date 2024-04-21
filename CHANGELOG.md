# Change Log

## [1.0.1] - 2024-04-21

### Added

- Persist options through server/game restart.
- Persist users exempted from restrictions through server/game restart.

### Changed

- Changed admin UI to simplify rate limit configuration. Now just _spawns_per_minute_ is configurable, and is (I hope!) simpler to understand, with no loss of functionality.
- Added option to admin UI so that admin user can simply enable/disable restrictions for themselves via a toggle. Previously a separate command block named `nologrief` was needed and the automatic disabling when using the `logrief` command block caused lots of confusion.

### Fixed

- It was possible when changing the spawn rate to end up in a situation where the users spawn count was much higher than the newly configured spawn limit and with a slow recharge this could leave them unable to spawn entities for a prolonged period of time. Now if the per user spawn count is much higher than the current rate, it is adjusted down.
