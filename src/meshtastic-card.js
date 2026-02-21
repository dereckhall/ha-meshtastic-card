import {
  LitElement,
  html,
  css,
} from "lit";

class MeshtasticCard extends LitElement {
  static get properties() {
    return {
      hass: {},
      config: {},
      _nodesExpanded: { type: Boolean },
    };
  }

  constructor() {
    super();
    this._nodesExpanded = false;
  }

  static getConfigForm() {
    return {
      schema: [
        {
          name: "device_id",
          selector: {
            device: {
              filter: {
                integration: 'meshtastic',
              }
            }
          }
        },
      ],
      computeLabel: (schema) => {
        if (schema.name === "device_id") return "Device";
        return undefined;
      },
    }
  }

  static getStubConfig(hass) {
    const entity = Object.values(hass.entities).find(e => e.platform === 'meshtastic');

    return { device_id: entity?.device_id ?? '', };
  }

  setConfig(config) {
    if (!config.device_id) throw new Error("Please define a Meshtastic device");
    this.config = config;
  }

  _getDeviceEntities() {
    return Object.values(this.hass.entities).filter(e => e.device_id === this.config.device_id);
  }

  _getState(suffix) {
    const found = this._getDeviceEntities().find(e => e.entity_id.includes(suffix));
    return found ? this.hass.states[found.entity_id] : null;
  }

  _formatUptime(seconds) {
    const s = parseInt(seconds) || 0;
    if (s === 0) return "N/A";
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    return `${d > 0 ? d + 'd ' : ''}${h > 0 ? h + 'h ' : ''}${m}m`;
  }

  _formatRelativeTime(utcString) {
    const match = utcString.match(/(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2}) UTC/);
    if (!match) return utcString;
    const then = Date.UTC(match[1], match[2] - 1, match[3], match[4], match[5], match[6]);
    const diffSec = Math.floor((Date.now() - then) / 1000);
    if (diffSec < 60) return "just now";
    const m = Math.floor(diffSec / 60);
    if (m < 60) return `${m} min ago`;
    const h = Math.floor(m / 60);
    const rm = m % 60;
    if (h < 24) return rm > 0 ? `${h}h ${rm}min ago` : `${h}h ago`;
    const d = Math.floor(h / 24);
    return `${d}d ${h % 24}h ago`;
  }

  _parseOnlineNodes(stateObj) {
    const list = stateObj?.attributes?.online_nodes;
    if (!Array.isArray(list)) return [];
    return list.map(entry => {
      const match = entry.match(/^(.+?) \(last heard: (.+)\)$/);
      if (!match) return { name: entry, ago: "" };
      return { name: match[1], ago: this._formatRelativeTime(match[2]) };
    });
  }

  _toggleNodes() {
    this._nodesExpanded = !this._nodesExpanded;
  }

  _renderBar(label, stateObj, icon, color, showPower = false, isPowered = false) {
    const val = parseFloat(stateObj?.state) || 0;
    return html`
      <div class="stat-bar">
        <div class="stat-info">
          <span>
            <ha-icon icon="${icon}"></ha-icon> ${label}
            ${showPower && isPowered ? html`<ha-icon icon="mdi:flash" class="charging-icon"></ha-icon>` : ""}
          </span>
          <span class="stat-value">${val}${stateObj?.attributes.unit_of_measurement || ""}</span>
        </div>
        <div class="bar-bg"><div class="bar-fill" style="width: ${Math.min(val, 100)}%; background-color: ${color}"></div></div>
      </div>
    `;
  }

  render() {
    if (!this.hass || !this.config) return html``;

    const device = this.hass.devices[this.config.device_id];

    const battery = this._getState("battery_level");
    const voltage = this._getState("device_voltage");
    const util = this._getState("channel_utilization");
    const airtime = this._getState("airtime");
    const powered = this._getState("device_powered")?.state === "on";

    const rx = this._getState("packets_rx")?.state || 0;
    const tx = this._getState("packets_tx")?.state || 0;
    const relayed = this._getState("packets_tx_relayed")?.state || 0;
    const canceled = this._getState("packets_tx_relay_cancelled")?.state || 0;
    const bad = this._getState("packets_rx_bad")?.state || 0;
    const dup = this._getState("packets_rx_duplicate")?.state || 0;

    return html`
      <ha-card>
        <div class="header">
          <div class="title-group">
            <div class="node-name">
                ${this._getState("node_short_name")?.state}
                <span class="long-name">| ${this._getState("node_long_name")?.state}</span>
            </div>
            <div class="hw-version">${device?.model} • v${device?.sw_version}</div>
          </div>
          <div class="uptime-badge">${this._formatUptime(this._getState("device_uptime")?.state)}</div>
        </div>

        <div class="main-stats">
          ${this._renderBar("Battery", battery, "mdi:battery", "#4CAF50", true, powered)}
          ${this._renderBar("Channel", util, "mdi:chart-donut", "#2196F3")}
          ${this._renderBar("Airtime", airtime, "mdi:clock-fast", "#FF9800")}
        </div>

        <div class="secondary-stats">
            <div class="sec-item"><ha-icon icon="mdi:flash-outline"></ha-icon> ${voltage?.state}V</div>
            <div class="sec-item nodes-toggle" @click=${this._toggleNodes}>
              <ha-icon icon="mdi:antenna"></ha-icon>
              ${this._getState("nodes_online")?.state}/${this._getState("nodes_total")?.state} Nodes
              <ha-icon icon="mdi:chevron-${this._nodesExpanded ? 'up' : 'down'}" class="chevron"></ha-icon>
            </div>
        </div>

        ${this._nodesExpanded ? html`
          <div class="nodes-list">
            ${this._parseOnlineNodes(this._getState("nodes_online")).map(node => html`
              <div class="node-row">
                <span class="node-row-name">${node.name}</span>
                <span class="node-row-ago">${node.ago}</span>
              </div>
            `)}
            ${this._parseOnlineNodes(this._getState("nodes_online")).length === 0 ? html`
              <div class="node-row"><span class="node-row-name" style="opacity: 0.5">No online nodes</span></div>
            ` : ""}
          </div>
        ` : ""}

        <div class="traffic-section">
          <div class="traffic-header">NETWORK TRAFFIC</div>
          <div class="traffic-grid">
            <div class="t-item"><span>Sent</span><strong>${tx}</strong></div>
            <div class="t-item"><span>Received</span><strong>${rx}</strong></div>
            <div class="t-item"><span>Relayed</span><strong class="blue">${relayed}</strong></div>
            <div class="t-item"><span>Canceled</span><strong class="red">${canceled}</strong></div>
            <div class="t-item"><span>Duplicate</span><strong class="orange">${dup}</strong></div>
            <div class="t-item"><span>Malformed</span><strong class="red">${bad}</strong></div>
          </div>
        </div>
      </ha-card>
    `;
  }

  static get styles() {
    return css`
      ha-card { padding: 16px; border-radius: 12px; }
      .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
      .node-name { font-size: 1.1em; font-weight: bold; }
      .long-name { font-weight: normal; font-size: 0.8em; opacity: 0.6; }
      .hw-version { font-size: 0.7em; opacity: 0.5; margin-top: 2px; }
      .uptime-badge { font-size: 0.75em; background: var(--secondary-background-color); padding: 2px 8px; border-radius: 10px; font-family: monospace; }

      .main-stats { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
      .stat-bar { display: flex; flex-direction: column; gap: 2px; }
      .stat-info { display: flex; justify-content: space-between; font-size: 0.75em; opacity: 0.8; align-items: center; }
      .stat-info ha-icon { --mdc-icon-size: 14px; }
      .charging-icon { color: #fdd835; margin-left: 4px; animation: pulse 2s infinite; }

      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.4; }
        100% { opacity: 1; }
      }

      .bar-bg { background: var(--secondary-background-color); height: 4px; border-radius: 2px; overflow: hidden; }
      .bar-fill { height: 100%; transition: width 1s ease; }

      .secondary-stats { display: flex; justify-content: space-around; font-size: 0.85em; padding: 8px 0; border-top: 1px solid var(--divider-color); }
      .sec-item { display: flex; align-items: center; gap: 4px; }
      .sec-item ha-icon { --mdc-icon-size: 16px; color: var(--secondary-text-color); }
      .nodes-toggle { cursor: pointer; user-select: none; }
      .nodes-toggle:hover { opacity: 0.7; }
      .chevron { --mdc-icon-size: 14px; margin-left: 2px; }

      .nodes-list { background: var(--secondary-background-color); border-radius: 8px; padding: 8px 10px; margin-top: 8px; display: flex; flex-direction: column; gap: 4px; }
      .node-row { display: flex; justify-content: space-between; align-items: center; font-size: 0.78em; padding: 3px 0; border-bottom: 1px solid var(--divider-color); }
      .node-row:last-child { border-bottom: none; }
      .node-row-name { font-weight: 500; }
      .node-row-ago { opacity: 0.5; font-size: 0.9em; }

      .traffic-section { background: var(--secondary-background-color); padding: 10px; border-radius: 8px; margin-top: 8px; }
      .traffic-header { font-size: 0.65em; font-weight: bold; letter-spacing: 1px; margin-bottom: 8px; opacity: 0.5; }
      .traffic-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
      .t-item { display: flex; flex-direction: column; font-size: 0.75em; }
      .t-item span { opacity: 0.6; font-size: 0.8em; margin-bottom: 2px; }
      .t-item strong { font-size: 1.1em; }
      .blue { color: #2196F3; } .red { color: #f44336; } .orange { color: #FF9800; }
    `;
  }
}
customElements.define("meshtastic-card", MeshtasticCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "meshtastic-card",
  name: "Meshtastic Node Card",
  preview: true,
  description: "Monitoring card for Meshtastic LoRa nodes."
});
