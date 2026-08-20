<a id="readme-top"></a>

<div align="center">
  <a href="https://github.com/frostful/pw-focus">
    <img src="assets/icon-128.png" alt="PW Focus logo" width="112" height="112">
  </a>

  <h1>PW Focus</h1>

  <p>A lightweight, distraction-free layout for the Physics Wallah study dashboard.</p>

  <p>
    <img src="https://img.shields.io/badge/Chrome-111%2B-4285F4?logo=googlechrome&logoColor=white" alt="Chrome 111 or newer">
    <img src="https://img.shields.io/badge/Manifest-V3-8B7CF6" alt="Manifest V3">
    <img src="https://img.shields.io/badge/version-1.0.1-5B4BC4" alt="Version 1.0.1">
    <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-2EA44F" alt="MIT License"></a>
  </p>

  <p>
    <a href="#installation"><strong>Install PW Focus</strong></a>
    ·
    <a href="https://github.com/frostful/pw-focus/releases">Releases</a>
    ·
    <a href="https://github.com/frostful/pw-focus/issues">Report a bug</a>
  </p>
</div>

---

## About

PW Focus simplifies the PW study area without blocking requests or modifying account data. It runs only on `https://www.pw.live/study-v2/*`, stores preferences in Chrome, and stays out of the way when Focus mode is disabled.

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

### From a release

1. Download the latest `pw-focus-v*.zip` from [Releases](https://github.com/frostful/pw-focus/releases/latest).
2. Extract the ZIP file.
3. Open `chrome://extensions` in Chrome.
4. Enable **Developer mode**.
5. Select **Load unpacked** and choose the extracted folder.
6. Refresh `https://www.pw.live/study-v2/study`.

### From source

```sh
git clone https://github.com/frostful/pw-focus.git
```

Then load the cloned folder through `chrome://extensions` using the same steps above.

> PW Focus requires Chrome 111 or newer.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Usage

Open PW Focus from the Chrome toolbar. Changes save automatically.

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

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Releases

The latest packaged extension and release notes are available on the [GitHub Releases page](https://github.com/frostful/pw-focus/releases). See [CHANGELOG.md](CHANGELOG.md) for the complete version history.

Current release: **v1.0.1** — refreshed project branding and open-source documentation.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Development

PW Focus uses plain JavaScript and CSS with no runtime or build dependencies.

```sh
npm run check
```

The release checker validates the manifest, JavaScript syntax, required assets, permissions, version alignment, and common accidental secrets or debug code.

After making changes, reload PW Focus from `chrome://extensions` and refresh the PW tab.

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
