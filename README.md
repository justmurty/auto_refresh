# Auto Refresh & Keep Awake Extension

A Chrome and Edge extension that automatically refreshes tabs at custom intervals, and prevents the computer from going to sleep with the "Keep Awake" feature.

## Features

- **Auto-refresh** tabs at customizable intervals.
- **Start/stop refreshing** with a single click.
- Support for **custom intervals** (seconds and minutes).
- **Prevent the computer from sleeping** using the "Keep Awake" feature.
- Compatible with **Chrome** and **Edge**.

## Installation

1. Clone or download the repository.
2. Go to `chrome://extensions/` (Chrome) or `edge://extensions/` (Edge).
3. Enable **Developer Mode** and click **Load unpacked**.
4. Select the extension folder.

## Usage

- Open the extension popup.
- Select the refresh interval or set a custom one.
- Click "**▶**" to start or "**✖**" to stop the refresh.
- Use the "**Keep Awake**" button to prevent your computer from going to sleep while the extension is running.

## "Keep Awake" Feature

- The **Keep Awake** button in the extension's interface keeps your computer from entering sleep mode while the refresh or click functions are active. This is particularly useful if you're running tasks that need continuous monitoring.

### How to Use:
- Click the "**☕**" button to activate the "Keep Awake" feature (this will ensure that your computer stays awake).
- Clicking it again will deactivate the feature, and your computer can return to its normal sleep behavior.

## Permissions

- **storage**
- **activeTab**
- **scripting**
- **tabs**
- **power** (for the "Keep Awake" functionality)

## Compatibility

- Works with **Chrome** and **Edge** (Chromium-based).

## License

**MIT License**
