/**
 * Hardware system architecture — nodes, groups, edges, and legend metadata.
 * Edit this file to update diagram content without touching layout code.
 */

/** @typedef {'media' | 'heating' | 'od' | 'odControl' | 'mixing' | 'power' | 'comms' | 'ph' | 'control'} SubsystemId */

/**
 * @typedef {Object} SubsystemDef
 * @property {SubsystemId} id
 * @property {string} label
 * @property {string} color
 * @property {string} description
 */

/** @type {Record<SubsystemId, SubsystemDef>} */
export const HARDWARE_SUBSYSTEMS = {
  control: {
    id: "control",
    label: "Control",
    color: "#2d9194",
    description: "Bioreactor vessel and Arduino Nano controller.",
  },
  media: {
    id: "media",
    label: "Media",
    color: "#e8915c",
    description: "Peristaltic pumps and dilution-based population control.",
  },
  heating: {
    id: "heating",
    label: "Heating",
    color: "#4a90d9",
    description: "Temperature sensor and heater feedback loop.",
  },
  od: {
    id: "od",
    label: "OD calibration",
    color: "#e85c9c",
    description: "Reference photodiode calibrates OD readings against LED drift.",
  },
  odControl: {
    id: "odControl",
    label: "OD control",
    color: "#d4622a",
    description: "High OD triggers dilution to return culture to log-phase growth.",
  },
  mixing: {
    id: "mixing",
    label: "Mixing",
    color: "#6b8f71",
    description: "PC fan and stir bar keep culture homogeneous.",
  },
  power: {
    id: "power",
    label: "Power",
    color: "#647984",
    description: "Laptop or wall supply, converted to 5 V and distributed.",
  },
  comms: {
    id: "comms",
    label: "Communication",
    color: "#2d9194",
    description: "USB, I2C, and links to a central microcontroller.",
  },
  ph: {
    id: "ph",
    label: "pH (manual)",
    color: "#d64545",
    description: "Periodic effluent sampling for external pH measurement.",
  },
}

/** Legend order for the side panel */
export const HARDWARE_LEGEND_ORDER = [
  "media",
  "heating",
  "od",
  "odControl",
  "mixing",
  "power",
  "comms",
  "ph",
]

/**
 * @typedef {Object} ArchNode
 * @property {string} id
 * @property {string} label
 * @property {SubsystemId} [subsystem]
 * @property {string} [note]
 */

/**
 * @typedef {Object} ArchGroup
 * @property {string} id
 * @property {string} label
 * @property {SubsystemId} subsystem
 * @property {boolean} collapsible
 * @property {ArchNode[]} children
 * @property {string} [gridArea]
 */

/** @type {ArchGroup[]} */
export const HARDWARE_ARCH_GROUPS = [
  {
    id: "bioreactor",
    label: "Bioreactor 1",
    subsystem: "control",
    collapsible: false,
    gridArea: "bioreactor",
    children: [],
  },
  {
    id: "arduino",
    label: "Arduino Nano 1",
    subsystem: "control",
    collapsible: false,
    gridArea: "arduino",
    children: [],
  },
  {
    id: "media",
    label: "Media",
    subsystem: "media",
    collapsible: true,
    gridArea: "media",
    children: [
      { id: "media-inlet", label: "Inlet Peristaltic Pump", subsystem: "media" },
      { id: "media-inlet2", label: "Inlet 2? Peristaltic Pump", subsystem: "media" },
      { id: "media-outlet", label: "Outlet? Peristaltic Pump", subsystem: "media" },
    ],
  },
  {
    id: "heating",
    label: "Heating",
    subsystem: "heating",
    collapsible: true,
    gridArea: "heating",
    children: [
      { id: "heating-sensor", label: "Temperature Sensor", subsystem: "heating" },
      { id: "heating-heater", label: "Heater", subsystem: "heating" },
    ],
  },
  {
    id: "od",
    label: "OD",
    subsystem: "od",
    collapsible: true,
    gridArea: "od",
    children: [
      { id: "od-ref", label: "Reference Photodiode", subsystem: "od" },
      { id: "od-pd", label: "Photodiode", subsystem: "od" },
      { id: "od-led", label: "LED", subsystem: "od" },
    ],
  },
  {
    id: "mixing",
    label: "Mixing",
    subsystem: "mixing",
    collapsible: true,
    gridArea: "mixing",
    children: [
      { id: "mixing-fan", label: "PC Fan", subsystem: "mixing" },
      { id: "mixing-stir", label: "Stir Bar", subsystem: "mixing" },
    ],
  },
  {
    id: "power",
    label: "Power",
    subsystem: "power",
    collapsible: true,
    gridArea: "power",
    children: [
      { id: "power-source", label: "Power Source", subsystem: "power" },
      { id: "power-laptop", label: "Laptop OR Socket", subsystem: "power" },
      { id: "power-converter", label: "Power Converter / Transformer", subsystem: "power" },
    ],
  },
  {
    id: "comms",
    label: "Communication",
    subsystem: "comms",
    collapsible: true,
    gridArea: "comms",
    children: [
      { id: "comms-flash", label: "USB flash drive", subsystem: "comms" },
      { id: "comms-serial", label: "USB serial connection", subsystem: "comms" },
      { id: "comms-i2c", label: "I2C connection", subsystem: "comms" },
      { id: "comms-mcu", label: "Big central microcontroller", subsystem: "comms" },
    ],
  },
  {
    id: "ph",
    label: "pH sensor",
    subsystem: "ph",
    collapsible: false,
    gridArea: "ph",
    children: [],
    note: "Periodically generate effluent for manual measurement of pH.",
  },
]

/**
 * @typedef {Object} ArchEdge
 * @property {string} id
 * @property {string} from
 * @property {string} to
 * @property {SubsystemId} subsystem
 * @property {string} [label]
 * @property {boolean} [dashed]
 */

/** @type {ArchEdge[]} */
export const HARDWARE_ARCH_EDGES = [
  {
    id: "e-bio-arduino",
    from: "bioreactor",
    to: "arduino",
    subsystem: "control",
    label: "Onboard control",
  },
  {
    id: "e-arduino-media",
    from: "arduino",
    to: "media",
    subsystem: "media",
    label: "Regulate bacterial population by dilution via injecting more fluid",
  },
  {
    id: "e-arduino-heating",
    from: "arduino",
    to: "heating",
    subsystem: "heating",
    label: "Temperature regulation feedback",
  },
  {
    id: "e-arduino-od-cal",
    from: "arduino",
    to: "od",
    subsystem: "od",
    label: "For calibration of OD due to LED fluctuations",
  },
  {
    id: "e-arduino-od-ctrl",
    from: "arduino",
    to: "od",
    subsystem: "odControl",
    label: "OD too high! Bacteria must be diluted to go back to log phase growth",
  },
  {
    id: "e-arduino-mixing",
    from: "arduino",
    to: "mixing",
    subsystem: "mixing",
  },
  {
    id: "e-bio-comms",
    from: "bioreactor",
    to: "comms",
    subsystem: "comms",
    label: "Method of communication",
  },
  {
    id: "e-power-media",
    from: "power",
    to: "media",
    subsystem: "power",
    label: "PWM",
  },
  {
    id: "e-power-heating",
    from: "power",
    to: "heating",
    subsystem: "power",
  },
  {
    id: "e-power-od",
    from: "power",
    to: "od",
    subsystem: "power",
  },
  {
    id: "e-power-mixing",
    from: "power",
    to: "mixing",
    subsystem: "power",
  },
  {
    id: "e-power-convert",
    from: "power",
    to: "power",
    subsystem: "power",
    label: "Convert to 5V",
  },
  {
    id: "e-media-ph",
    from: "media",
    to: "ph",
    subsystem: "ph",
    label: "Effluent sample",
    dashed: true,
  },
]

/** Anchor points (0–1) for SVG edge routing per group id */
export const HARDWARE_GROUP_ANCHORS = {
  bioreactor: { x: 0.5, y: 0.08 },
  arduino: { x: 0.5, y: 0.22 },
  media: { x: 0.14, y: 0.48 },
  heating: { x: 0.38, y: 0.48 },
  od: { x: 0.62, y: 0.48 },
  mixing: { x: 0.86, y: 0.48 },
  power: { x: 0.5, y: 0.78 },
  comms: { x: 0.88, y: 0.22 },
  ph: { x: 0.08, y: 0.72 },
}
