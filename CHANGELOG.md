# Changelog

All notable changes to PW Focus are documented here.

## [1.1.0] - 2026-08-21

### Added

- Added toggle to hide promotional banners (Star Pass, Saarthi promo carousels).
- Added toggle to hide recommendation carousels (Trending Among Peers, Batches for You).
- Added toggle to dim locked/inaccessible offerings with hover restore.
- Added CSS-module class hints as selector accelerators with fallback to text matching.
- Added detection patterns for Saarthi, Test Press, UPSC Mentorship, and Connect with Us offerings.
- Added section patterns for Trending Among Peers and Batches for You.

### Changed

- Improved dashboard and batch item detection resilience across PW frontend builds.

## [1.0.1] - 2026-08-20

### Changed

- Replaced the project icon and popup branding.
- Reworked the README around a concise open-source project template.
- Removed the unused legacy SVG icon.
- Switched extension API calls to a shared Chrome/Firefox namespace adapter.

### Added

- Added release installation instructions and version history.
- Added a Firefox 109+ Manifest V3 build with a stable Mozilla add-on ID.
- Declared Mozilla's required built-in data consent value: no data collection.
- Added dependency-free Chrome and Firefox build commands.

## [1.0.0] - 2026-08-20

### Added

- Initial production-ready Chrome extension release.
- Distraction picker with persistent restore controls.
- Expandable-section handling and dashboard reordering.
- Focused appearance controls and emergency page restoration.
- Privacy, security, licensing, and automated release checks.

[1.1.0]: https://github.com/frostful/pw-focus/releases/tag/v1.1.0
[1.0.1]: https://github.com/frostful/pw-focus/releases/tag/v1.0.1
[1.0.0]: https://github.com/frostful/pw-focus/releases/tag/v1.0.0
