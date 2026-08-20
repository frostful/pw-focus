<a id="readme-top"></a>

<div align="center">
  <a href="https://github.com/frostful/pw-focus">
    <img src="assets/icon-128.png" alt="PW Focus logo" width="112" height="112">
  </a>

  <h1>PW Focus</h1>

  <p>A lightweight, distraction-free PW study dashboard for Chrome and Firefox.</p>

  <p>
    <img src="https://img.shields.io/badge/Chrome-111%2B-4285F4?logo=googlechrome&logoColor=white" alt="Chrome 111 or newer">
    <img src="https://img.shields.io/badge/Firefox-109%2B-FF7139?logo=firefoxbrowser&logoColor=white" alt="Firefox 109 or newer">
    <img src="https://img.shields.io/badge/Manifest-V3-8B7CF6" alt="Manifest V3">
    <img src="https://img.shields.io/badge/version-1.0.1-5B4BC4" alt="Version 1.0.1">
    <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-2EA44F" alt="MIT License"></a>
  </p>

  <p>
    <a href="#installation"><strong>Install PW Focus</strong></a>
    ·
    <a href="https://addons.mozilla.org/firefox/">Firefox Add-ons</a>
    ·
    <a href="https://github.com/frostful/pw-focus/releases">Releases</a>
    ·
    <a href="https://github.com/frostful/pw-focus/issues">Report a bug</a>
  </p>
</div>

---

## About

PW Focus simplifies the PW study area without blocking requests or modifying account data. It runs only on `https://www.pw.live/study-v2/*`, stores preferences through the browser extension API, and stays out of the way when Focus mode is disabled.

### Features

| Feature | What it does |
| --- | --- |
| Distraction picker | Hide an element and restore it later from the extension menu. |
| Always expanded | Keeps supported **Show More** sections open. |
| Layout editor | Reorder dashboard sections and Batch Offerings with drag handles. |
| Appearance controls | Adjust content width, container style, accent, radius, and opacity. |
| Persistent preferences | Keeps hidden items, layout order, and appearance after refresh. |
| Emergency restore | Disables cleanup and restores the complete PW page in one click. |

PW Focus contains no analytics, advertisements, remote code, or external service integration.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Installation

### Chrome

1. Download the latest Chrome ZIP from [Releases](https://github.com/frostful/pw-focus/releases/latest).
2. Extract the ZIP file.
3. Open `chrome://extensions` in Chrome.
4. Enable **Developer mode**.
5. Select **Load unpacked** and choose the extracted folder.
6. Refresh `https://www.pw.live/study-v2/study`.

### Firefox

Firefox Add-ons listing: **[Pending]()**.

For temporary testing from source:

```sh
git clone https://github.com/frostful/pw-focus.git
cd pw-focus
npm run build:firefox
```

1. Open `about:debugging#/runtime/this-firefox`.
2. Select **Load Temporary Add-on**.
3. Choose `dist/firefox/manifest.json`.
4. Refresh the PW study page.

Temporary add-ons disappear when Firefox closes. Normal installation requires a Mozilla-signed XPI from [addons.mozilla.org](https://addons.mozilla.org/) or Mozilla's unlisted signing flow.

> PW Focus requires Chrome 111+ or Firefox 109+.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Usage

Open PW Focus from the browser toolbar. Changes save automatically.

- Select **Edit layout** to reveal drag handles on the PW page. Finish editing to hide them again.
- Select **Hide an element**, then click a distraction on the page. Press `Escape` to cancel.
- Use `Alt+Shift+X` to start or stop the element picker from the keyboard.
- Open **Reset options** to restore hidden items, reset layout order, or show everything.

PW occasionally changes its page structure. If a saved element can no longer be found, PW Focus ignores that stale rule safely.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Permissions and privacy

| Access | Reason |
| --- | --- |
| `storage` | Saves preferences, hidden-element rules, and layout order. |
| `https://www.pw.live/study-v2/*` | Restricts page access to the PW study area. |

PW Focus does not collect browsing history, credentials, cookies, payment information, or usage analytics. Read the full [Privacy Policy](PRIVACY.md) and report vulnerabilities using [Security Policy](SECURITY.md).

The Firefox manifest explicitly declares `data_collection_permissions.required: ["none"]` for Mozilla's built-in data-consent system.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Releases

Packaged browser builds and release notes are available on the [GitHub Releases page](https://github.com/frostful/pw-focus/releases). See [CHANGELOG.md](CHANGELOG.md) for the complete version history.

Current release: **v1.0.1** — refreshed branding, open-source documentation, and Firefox support.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Development

PW Focus uses plain JavaScript and CSS with no runtime or build dependencies.

```sh
npm run check
npm run build:chrome
npm run build:firefox
```

The release checker validates both manifests, JavaScript syntax, required assets, permissions, version alignment, cross-browser API usage, and common accidental secrets or debug code. Browser builds are written to `dist/chrome` and `dist/firefox`.

After making changes, rebuild and reload PW Focus from `chrome://extensions` or `about:debugging`, then refresh the PW tab.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Contributing

Bug reports and focused pull requests are welcome.

1. Fork the repository.
2. Create a branch: `git checkout -b fix/short-description`.
3. Make and test the change.
4. Run `npm run check`.
5. Open a pull request explaining the problem and the result.

Please do not include PW credentials, cookies, authentication tokens, or personal account data in issues, screenshots, or logs.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Disclaimer

PW Focus is an independent community project. It is not affiliated with, endorsed by, or sponsored by Physics Wallah.

## License

Distributed under the MIT License. See [LICENSE](LICENSE) for details.

<p align="right">(<a href="#readme-top">back to top</a>)</p>
