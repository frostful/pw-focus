# PW Focus

PW Focus is a lightweight Chrome extension for simplifying the Physics Wallah study dashboard. It runs entirely in the browser and does not modify account data or block network requests.

## Features

- Hide selected distractions and restore them later.
- Keep supported Show More sections expanded.
- Reorder dashboard sections and Batch Offerings.
- Choose a focused or wide layout.
- Use Liquid glass or flat dashboard containers.
- Customize the accent, corner radius, and container opacity.

## Install from source

1. Download or clone this repository.
2. Open `chrome://extensions` in Chrome.
3. Enable **Developer mode**.
4. Select **Load unpacked**.
5. Choose the extension folder containing `manifest.json`.
6. Reload `https://www.pw.live/study-v2/study`.

## Usage

Open PW Focus from the Chrome toolbar. Layout changes are saved automatically. **Hide an element** starts the page picker; press `Escape` to cancel. The picker can also be started with `Alt+Shift+X`.

## Permissions

- `storage`: saves preferences, hidden-element rules, and layout order.
- `https://www.pw.live/study-v2/*`: limits page access to the PW study area.

PW Focus contains no analytics, advertising, remote code, or external service integration. See [PRIVACY.md](PRIVACY.md) for details.

## Development

The extension has no runtime or build dependencies. Run the release checks with:

```sh
npm run check
```

After changing extension files, reload PW Focus from `chrome://extensions` and refresh the PW tab.

## Compatibility

PW Focus requires Chrome 111 or later. PW may change its page structure; stale saved selectors are ignored safely and can be replaced with the picker.

## Disclaimer

PW Focus is an independent community project. It is not affiliated with, endorsed by, or sponsored by Physics Wallah.

## License

Released under the [MIT License](LICENSE).
