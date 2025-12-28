# Meshtastic card

[![GH-release](https://img.shields.io/github/v/release/hamper/meshtastic-card.svg?style=flat-square)](https://github.com/hamper/meshtastic-card/releases)
[![GH-last-commit](https://img.shields.io/github/last-commit/hamper/meshtastic-card.svg?style=flat-square)](https://github.com/hamper/meshtastic-card/commits/main)
[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg?style=flat-square)](https://github.com/hacs)

The card is linked to the Meshtastic custom components. <https://github.com/meshtastic/home-assistant>

## Screenshots

![meshtastic-card](https://raw.githubusercontent.com/hamper/meshtastic-card/master/examples/card-configuration.png)

## Installation

### Prerequisites

> [!WARNING]
> Before using this card, please ensure you have the [Meshtastic integration](https://github.com/meshtastic/home-assistant) installed in your Home Assistant instance.

### HACS (Recommended)

[![HACS](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=hamper&repository=meshtastic-card&category=dashboard)

1. Open HACS in your Home Assistant instance
2. Click the menu icon in the top right and select "Custom repositories"
3. Add this repository URL and select "Dashboard" as the category
   - `https://github.com/hamper/meshtastic-card`
4. Click "Install"

### Manual Installation

1. Download the `meshtastic-card.js` file from the latest release in the Releases tab.
2. Copy it to your `www/community/meshtastic-card/` folder
3. Add the following to your `configuration.yaml` (or add as a resource in dashboards menu)

```yaml
lovelace:
  resources:
    - url: /local/community/meshtastic-card/meshtastic-card.js
      type: module
```

## Usage

Add the card to your dashboard using the UI editor or YAML:

### Card Editor

The card is fully configurable through the card editor, allowing you to customize:

- Meshtastic device selection (single or multiple)

### YAML

This is the most minimal configuration needed to get started:

```yaml
type: custom:meshtastic-card
device_id: your_meshtastic_device_id
```

### Finding Your Device ID

If you're unsure what your Meshtastic device ID is, here are several ways to find it:

#### Method 1: Use the Card Editor (Recommended)

1. Add the card through the visual editor
2. Select your Meshtastic device from the dropdown
3. Click "Show Code Editor" or "View YAML" to see the generated configuration
4. Copy the `device_id` value for use in manual YAML configuration

#### Method 2: Devices Page

1. Go to **Settings** → **Devices & Services** → **Devices**
2. Search for "Meshtastic" or browse to find your Meshtastic device
3. Click on the device and look at the URL - the device ID will be in the URL path

## Acknowledgments

- Built using [LitElement](https://lit.dev/)
