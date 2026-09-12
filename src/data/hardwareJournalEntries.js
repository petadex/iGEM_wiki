/**
 * @typedef {Object} HardwareJournalLink
 * @property {string} label
 * @property {string} href
 */

/**
 * @typedef {Object} HardwareJournalImage
 * @property {string} src - CDN URL under static.igem.wiki/.../hardware-notebook/
 * @property {string} [alt]
 * @property {string} [caption]
 */

/**
 * @typedef {Object} HardwareJournalEntry
 * @property {string} id - YYYY-MM-DD
 * @property {string} date
 * @property {string} label - Short sidebar label
 * @property {string} goal
 * @property {string} workCompleted
 * @property {string} result
 * @property {string} nextStep
 * @property {string[]} [deliverables]
 * @property {HardwareJournalLink[]} [links]
 * @property {HardwareJournalImage[]} [images]
 */

const HW_IMG = (path) => `https://static.igem.wiki/teams/6187/wiki/hardware-notebook/${path}`

/** @type {HardwareJournalEntry[]} */
const HARDWARE_JOURNAL_ENTRIES_RAW = [
  {
    id: "2026-03-13",
    date: "2026-03-13",
    label: "Mar 13",
    goal: "Onboard the hardware team and align on the pioreactor build direction.",
    workCompleted:
      "Shared reading resources in the drive; reviewed wet-lab assay context (PET–biotin collection surface) and pioreactor sticky-note notes.",
    result:
      "Team oriented on pioreactor as the starting platform and identified the wet-lab binding-assay constraint (false positives when cells cut PET without binding to the collector).",
    nextStep:
      "Continue pioreactor build; ask wetland leads about creative PETase filament testing ideas.",
  },
  {
    id: "2026-03-20",
    date: "2026-03-20",
    label: "Mar 20",
    goal: "Close sprint 1 and plan software + second pioreactor build.",
    workCompleted:
      "Reflected on first pioreactor build: screws, pumps, CPU-fan stirring, Raspberry Pi, photosensor OD, aeration, and heating. Reviewed stakeholder feedback (dry lab, wet lab, pioreactor expert login).",
    result:
      "Identified pain points — difficult screws, unclear instructions, hat-PCB limits one MCU per reactor, and material choices affecting accessibility.",
    nextStep:
      "Divide and conquer: software for bioreactor plus build of a second pioreactor; explore custom hat PCB or shared MCU options.",
  },
  {
    id: "2026-03-27",
    date: "2026-03-27",
    label: "Mar 27",
    goal: "Define user-friendly design criteria for an accessible DIY bioreactor.",
    workCompleted:
      "Patricia presented accessibility lessons from open-source hardware (DNA playground, Bento Lab, pioreactor). Team shared current requirements and discussed integration with wet-lab assays.",
    result:
      "Agreed on friendly UI, clear instructions, safe assembly, and core features (OD, mixing, web interface, pumps, heating). Upstream/downstream separators deprioritized for now.",
    nextStep:
      "Refine requirements with ergonomics in mind (gloves, goggles); continue pioreactor prototyping.",
  },
  {
    id: "2026-04-15",
    date: "2026-04-15",
    label: "Apr 15",
    goal: "Debrief with Pioreactor CEO and kick off BOM + requirement-string ownership.",
    workCompleted:
      "Reviewed CEO notes (Stemma QT, avoid Raspberry Pi, use cheaper MCUs). Assigned BOM owners per component; reviewed requirement strings by section.",
    result:
      "BOM research delegated across the team; MCU direction shifted away from Raspberry Pi; requirement flags assigned by subsystem.",
    nextStep:
      "Complete BOM entries on the shared sheet; continue MCU connectivity and pump-fitting research.",
    deliverables: [
      "BOM owners: Lindsay (Stemma QT), Lia (pH), Daisy (OD diodes), James (temp/heating), Aayush (printer), Karys (pump), Arya (fan), Claire (glassware/tubes)",
    ],
    links: [
      {
        label: "BOM sheet (April 2026)",
        href: "https://docs.google.com/spreadsheets/d/1TNwv2scEkocbdkn35FhmObunDVHcZ7TCm1Lv9EmIX5Q/edit?gid=0#gid=0",
      },
    ],
  },
  {
    id: "2026-04-29",
    date: "2026-04-29",
    label: "Apr 29",
    goal: "Continue BOM research and flag ambiguous requirement strings.",
    workCompleted:
      "Reviewed BOM progress on the shared sheet; leads asked dry lab and wet lab why we need a bioreactor and what we are measuring.",
    result: "BOM research ongoing; requirement-string review owners confirmed per section.",
    nextStep: "Finish component research; keep flagging ambiguous or high-priority requirements.",
  },
  {
    id: "2026-05-12",
    date: "2026-05-12",
    label: "May 12",
    goal: "Finalize BOM ordering decisions for core sensors and actuators.",
    workCompleted:
      "Reviewed highlighted BOM items: Stemma QT (I2C sensors, PWM pumps), cable costs, stepper motor for peristaltic pump, external vs internal temperature sensor, and manual pH measurement path.",
    result:
      "External temp sensor chosen for prototyping; manual pH via wet-lab probe accepted over unreliable inline sensing; thermocouple noted for autoclave path.",
    nextStep: "Place orders for agreed components; continue heater and pump integration research.",
  },
  {
    id: "2026-05-16",
    date: "2026-05-16",
    label: "May 16",
    goal: "Assign prototyping tasks for OD sensing, heating, and MCU connectivity.",
    workCompleted:
      "Discussed OD sensor options (~$14 TI), calibration efficiency, blackout box design, 3D-printed vs mason-jar caps, and PCB hat vs wrapped heater. Assigned MCU/wiring diagram research (CH32, STM32, Arduino, ESP32).",
    result:
      "OD research team formed (Aayush, Daisy, Claire); heater path confirmed with waterproof 10 cm sheath sensor; MCU compatibility investigation assigned.",
    nextStep:
      "Prototype OD calibration setup; investigate pin connections and libraries; complete testing procedure for Spencer.",
    deliverables: [
      "OD research — Aayush, Daisy, Claire",
      "Testing procedure / Spencer education — Soham, Aayush, Claire",
      "MCU wiring & library research — James, Soham (CH32)",
    ],
  },
  {
    id: "2026-05-19",
    date: "2026-05-19",
    label: "May 19",
    goal: "Bench-test peristaltic pump and OD sensing; reassess real-time pH.",
    workCompleted:
      "Ran peristaltic pump test with red/blue water; attempted OD readings (noisy data). Discussed real-time pH sensing with Quigley; Lindsay reviewed pins; Karys exploring DIY pumps; James found Arduino Nano deal at myFab.",
    result:
      "Real-time pH adjustment deprioritized as not useful for current assays; pump plumbing validated visually; OD needs calibration work.",
    nextStep: "Everyone review pioreactor source code; Claire and Aayush continue OD prototyping.",
  },
  {
    id: "2026-05-26",
    date: "2026-05-26",
    label: "May 26",
    goal: "Align bioreactor requirements with wet lab and dry lab measurement needs.",
    workCompleted:
      "Filmed pioreactor demo; dry-lab leads confirmed temperature sweeps matter more than pH sweeps. Defined targets: continuous flow, OD600 feedback loop, 25–70 °C heating, 3-pump layout (2 in, 1 out), manual pH. Updated BOM for OD (LED + photodiode), heaters (~7.5 W per vessel), and Stemma QT CAD for removable tubing.",
    result:
      "Shared requirements doc across subteams; heater wattage and heat-up time estimates documented; GFP fluorescence on output noted as optional.",
    nextStep:
      "OD trio meeting May 27; James on thermal interface materials; Lia on cloud integration; Lindsay on pump + sensor integration; Claire on cap-holder CAD.",
    deliverables: [
      "OD meeting — Daisy, Claire, Aayush (May 27)",
      "Thermal insulation research — James",
      "Systems integration — Lia",
      "Pump + sensor integration — Lindsay",
      "Cap-holder CAD — Claire",
    ],
  },
  {
    id: "2026-05-30",
    date: "2026-05-30",
    label: "May 30",
    goal: "Compare connectivity options for multi-reactor setups.",
    workCompleted:
      "Evaluated USB hub (long serial, many ports) vs WiFi/Bluetooth modules across setup difficulty, code rewrite, cost, and connection reliability.",
    result: "Tradeoff table started; no final architecture chosen yet.",
    nextStep: "Build cost/complexity comparison table and pick a connectivity path for scale-up.",
  },
  {
    id: "2026-06-02",
    date: "2026-06-02",
    label: "Jun 2",
    goal: "Lock OD component selection and draft system architecture v1.",
    workCompleted:
      "Selected combined photodiode + TIA for OD600; James calculated heater losses and insulation options; Lindsay validated pump wiring; Karys weighed reusing pioreactor CAD vs DIY pump. Drafted sensor → MCU → cloud hierarchy and split physical vs cloud UI controls.",
    result:
      "System architecture v1 outlined; physical UI for temp/runtime/OD controls, cloud for analytics; validation experiments assigned per subsystem.",
    nextStep:
      "Order two OD components; James to model heat-up time and resistor layout; everyone design subsystem validation experiments for next week.",
    deliverables: [
      "Order combined photodiode + TIA (×2)",
      "Power management research — Lindsay, Lia, James",
      "Subsystem validation experiments — all members",
    ],
    links: [
      {
        label: "System architecture diagram (Canva)",
        href: "https://www.canva.com/design/DAHLdj9nQqA/XR2nt-IOffrFGMTjgiRrkg/edit",
      },
    ],
  },
  {
    id: "2026-06-09",
    date: "2026-06-09",
    label: "Jun 9",
    goal: "Plan subsystem design-of-experiment protocols and CAD for caps/OD.",
    workCompleted:
      "Outreach check-in; member updates on CAD for self-healing caps and OD components; pH interim plan (effluent harvest + manual probe); microcontroller comparison; bioreactor layout sketching. Temperature / heater validation methods drafted in the master engineering workbook.",
    result:
      "DoE variables defined for flow rate, temperature accuracy, autoclave path, and sourcing; power budgeting and I2C daisy-chain options documented.",
    nextStep:
      "Solder pumps; finalize CAD prints; draft stress-test variable lists per subsystem.",
    images: [
      {
        src: HW_IMG("journal/master-temp-sensor-test-jun.avif"),
        alt: "Temperature sensor test setup from master workbook",
        caption: "Temperature sensor validation notes (master workbook).",
      },
      {
        src: HW_IMG("journal/master-heater-test-jun.avif"),
        alt: "Heater test setup from master workbook",
        caption: "Heater validation notes (master workbook).",
      },
    ],
  },
  {
    id: "2026-06-16",
    date: "2026-06-16",
    label: "Jun 16",
    goal: "Finalize OD CAD, transition to Jira, and review power diagrams.",
    workCompleted:
      "Claire completed initial OD CAD and sent prototype for print. Team discussed Jira for task tracking, RRF protocol diagrams, motor driver vs transistor tradeoffs, and power diagram review (capacitors, pull-up resistors, I2C buffer limits).",
    result: "OD CAD prototype ordered; RRF protocols in progress; power architecture reviewed as a team.",
    nextStep: "Continue KiCad pinout work; build RRF protocols with diagrams; run power diagram review follow-ups.",
  },
  {
    id: "2026-06-23",
    date: "2026-06-23",
    label: "Jun 23",
    goal: "Hand out subsystem components and align pinouts with DoE/RRF plans.",
    workCompleted:
      "Reviewed pinout diagrams (OD needs voltage divider); handed out subsystem components; discussed RRF and DoE; OD CAD check-in; TIM reminder; planned Arduino pinout layout activity.",
    result:
      "Subsystem ownership distributed; OD sensing validated at different densities pending temp/heater tests first.",
    nextStep: "Group build session; collect Arduino libraries in shared spreadsheet; finalize logic loops.",
  },
  {
    id: "2026-06-28",
    date: "2026-06-28",
    label: "Jun 28",
    goal: "Prepare for extended build session and finalize RRF experiment instructions.",
    workCompleted:
      "Planned 2.5–3 h build meeting: RRF finalization, Artem lab updates, Jira/item sign-out, When2Meet for build nights, KiCad pin diagram activity, and Arduino coding kickoff.",
    result: "Build-session agenda set; Sunday evening check-in scheduled for RRF edits.",
    nextStep: "Complete RRF instructions; run collaborative KiCad pin diagram session; start subsystem code.",
  },
  {
    id: "2026-07-07",
    date: "2026-07-07",
    label: "Jul 7",
    goal: "Launch shared repo, set build schedule, and integrate subsystem code.",
    workCompleted:
      "Set up sprints and team roster; created GitHub repo; chose Thursday build evenings. Member updates: Claire on ADAfruit library + new CAD; Lia on Serial Studio (8 devices); Lindsay soldered pumps; James on vial sleeve print and thermocouple at 55 °C; integration pseudocode reviewed.",
    result:
      "Bioreactor repo live; Thursday build nights confirmed; RRF deadline set for Friday.",
    nextStep:
      "Add subdesign folders to GitHub; complete RRFs; run in-person build tests; document progress for wiki.",
    deliverables: [
      "Complete RRFs by Friday",
      "Thursday build nights on calendars",
      "Subsystem folders in GitHub repo",
    ],
    links: [
      {
        label: "Bioreactor GitHub repo",
        href: "https://github.com/igem-toronto/Bioreactor",
      },
    ],
  },
  {
    id: "2026-07-09",
    date: "2026-07-09",
    label: "Jul 9",
    goal: "Re-CAD the OD vial holder for AS7343 sensors and pioreactor vial diameter.",
    workCompleted:
      "Replaced prior OPT101-oriented holder (stilts for stir-bar clearance, dual photodiode cutouts) with a 35 mm vial design, stilts attached for stability, and larger AS7343 cutouts while keeping dual-sensor orientation.",
    result: "Print-ready OD holder CAD updated for AS7343 + pioreactor vial geometry.",
    nextStep: "Print holder; start Nano + AS7343 wiring and Adafruit basic_readings sketch.",
    images: [
      {
        src: HW_IMG("journal/claire-od-cad-jul9-a.avif"),
        alt: "OD vial holder CAD iteration A",
        caption: "OD vial holder CAD — Jul 9 iteration.",
      },
      {
        src: HW_IMG("journal/claire-od-cad-jul9-b.avif"),
        alt: "OD vial holder CAD iteration B",
        caption: "AS7343 cutout / stilt layout.",
      },
    ],
  },
  {
    id: "2026-07-10",
    date: "2026-07-10",
    label: "Jul 10",
    goal: "Wire Arduino Nano to one AS7343 and verify I2C readings.",
    workCompleted:
      "Wired a single AS7343 (shared I2C address blocks dual sensors for now). Brought up Adafruit AS7343 basic_readings; fixed baud rate; used an I2C scanner sketch to confirm device ACK.",
    result: "Single-sensor path reading; dual-sensor addressing deferred to SoftWire / software I2C.",
    nextStep: "Continue OD setup; plan SoftWire for two same-address sensors.",
    links: [
      {
        label: "Adafruit AS7343 library",
        href: "https://github.com/adafruit/Adafruit_AS7343",
      },
    ],
    images: [
      {
        src: HW_IMG("journal/claire-as7343-wiring-jul10.avif"),
        alt: "AS7343 wiring to Arduino Nano",
        caption: "Nano + AS7343 wiring / verification.",
      },
    ],
  },
  {
    id: "2026-07-11",
    date: "2026-07-11",
    label: "Jul 11",
    goal: "Stabilize OD bench setup and reference collection workflow.",
    workCompleted:
      "Continued OD fixture setup after CAD/wiring; documented reference and blank collection needs for later nOD math.",
    result: "Physical OD test fixture progressing; reference logic still to be coded.",
    nextStep: "Implement reference / blank collection steps before dual-sensor runs.",
    images: [
      {
        src: HW_IMG("journal/claire-od-setup-jul11.avif"),
        alt: "OD bench setup",
        caption: "OD sensing bench setup.",
      },
    ],
  },
  {
    id: "2026-07-13",
    date: "2026-07-13",
    label: "Jul 13",
    goal: "Define reference vs measuring sensor roles for normalized OD.",
    workCompleted:
      "Sketched ref + measuring sensor logic so normalized OD can be computed as a ratio once SoftWire addresses both devices.",
    result: "Clearer nOD architecture: blank/dark calibration then live ratio.",
    nextStep: "Code SoftWire dual-bus reads; validate single-channel collection first.",
  },
  {
    id: "2026-07-18",
    date: "2026-07-18",
    label: "Jul 18",
    goal: "Collect single-sensor readings and lock reference procedure.",
    workCompleted: "Exercised single AS7343 reading path and documented reference collection for calibration.",
    result: "Single-sensor data path usable for early math checks.",
    nextStep: "Bring up second sensor on SoftWire.",
  },
  {
    id: "2026-07-20",
    date: "2026-07-20",
    label: "Jul 20",
    goal: "Run two AS7343 sensors and debug pump transistor drive.",
    workCompleted:
      "Claire: dual-sensor SoftWire path in progress. Lindsay: peristaltic pump drive via S8050 transistor — direct PSU-to-pump worked; base drive from Arduino failed; recalculated base resistor (~330 Ω) after datasheet math; also hit avrdude sync / upload failures.",
    result:
      "Dual OD addressing moving forward; pump circuit suspect (base resistor / transistor current headroom vs 500 mA pump).",
    nextStep: "Retry pump with ~330 Ω base resistor; confirm Nano upload path; keep SoftWire dual OD work.",
    images: [
      {
        src: HW_IMG("journal/claire-dual-sensor-jul19.avif"),
        alt: "Dual OD sensor bench",
        caption: "Dual-sensor OD work (Jul 19–20).",
      },
      {
        src: HW_IMG("journal/lindsay-pump-transistor-jul21-a.avif"),
        alt: "Pump transistor bench photo A",
        caption: "Pump / transistor bench — Jul 20–21.",
      },
      {
        src: HW_IMG("journal/lindsay-pump-transistor-jul21-b.avif"),
        alt: "Pump transistor bench photo B",
      },
      {
        src: HW_IMG("journal/lindsay-pump-transistor-jul21-c.avif"),
        alt: "Pump transistor bench photo C",
      },
    ],
    links: [
      {
        label: "Adafruit DC motor / transistor lesson",
        href: "https://learn.adafruit.com/adafruit-arduino-lesson-13-dc-motors/transistors",
      },
    ],
  },
  {
    id: "2026-07-21",
    date: "2026-07-21",
    label: "Jul 21",
    goal: "Advance serial UI architecture and keep subsystem actuation over COM.",
    workCompleted:
      "Lia: pushed for modular helpers and JSON-over-serial (temp / OD / actuator status). Explored pyserial host scripts; drafted UI features (command line, CSV download); researched Grafana / Flask / Prometheus path for later dashboards.",
    result: "Host↔Arduino contract leaning JSON; early Grafana install notes captured.",
    nextStep: "Prototype serial command loop for fan / heater / pump; harden error handling across ports.",
    images: [
      {
        src: HW_IMG("journal/lia-serial-ui-sketch-a.avif"),
        alt: "Serial UI sketch A",
        caption: "Serial / dashboard UI sketches.",
      },
      {
        src: HW_IMG("journal/lia-serial-ui-sketch-b.avif"),
        alt: "Serial UI sketch B",
      },
    ],
  },
  {
    id: "2026-07-25",
    date: "2026-07-25",
    label: "Jul 25",
    goal: "Clarify normalized OD vs spectrophotometer OD600 calibration.",
    workCompleted:
      "Documented nOD as current/reference ratio vs “real” OD from fitting nOD to spectrometer OD600; noted 180° transmission geometry for current fixture.",
    result: "Calibration plan: collect spectrometer OD600 alongside bioreactor ratios, fit curve, map live readings.",
    nextStep: "Collect paired calibration points once dual sensors are stable.",
    images: [
      {
        src: HW_IMG("journal/claire-od-math-jul25.avif"),
        alt: "OD math notes",
        caption: "nOD / OD600 math notes.",
      },
    ],
  },
  {
    id: "2026-07-27",
    date: "2026-07-27",
    label: "Jul 27",
    goal: "Resize OD mechanical envelope and continue pump/UI work.",
    workCompleted:
      "Claire: vial holder geometry notes (inner radius 35.1 mm; 148×148 mm plate; scale factors). Lindsay: continued pump drive debug. Lia: serial UI and multi-Arduino interface comments.",
    result: "Mechanical envelope refined for scaled prints; electrical/UI threads still open.",
    nextStep: "Integrate OD fixture with pump drawers in CAD; keep transistor + serial work.",
  },
  {
    id: "2026-07-30",
    date: "2026-07-30",
    label: "Jul 30",
    goal: "Characterize Sunon fan tach / RPM floor for stirring.",
    workCompleted:
      "Arya wired Sunon fan tach and confirmed RPM readout; lowest stable speed ~1800 RPM — too high for culture safety concerns.",
    result: "Fan usable for tach testing but minimum RPM likely unsuitable for bacteria; need geared / PWM alternative or different impeller drive.",
    nextStep: "Evaluate lower-RPM stirring options; document MicroSD autonomy notes from Jun 27 research.",
  },
  {
    id: "2026-08-04",
    date: "2026-08-04",
    label: "Aug 4",
    goal: "Stabilize multi-reactor Tkinter dashboard behavior.",
    workCompleted:
      "Lia: Tkinter dashboard testing — a bad input from one bioreactor disrupted telemetry for all units.",
    result: "Need per-reactor isolation / better validation so one fault does not take down the board.",
    nextStep: "Add input validation and isolate serial readers per port.",
  },
  {
    id: "2026-08-11",
    date: "2026-08-11",
    label: "Aug 11",
    goal: "Answer HP sustainability power questions and fix USB hub data path.",
    workCompleted:
      "Lia: HP power liaison; tested USB hubs — powered hubs often charge-only; non-powered transfer data. Researched powered hubs that still pass data. Continued code error-handling and GitHub workflow fixes. Claire: ongoing CAD/OD integration rewrite (dates fuzzy Aug 11–18).",
    result: "Clearer hub purchasing criteria; HP V1 power figures drafted for wiki.",
    nextStep: "Order data-capable powered hub; continue OD class rewrite + CAD drawers.",
  },
  {
    id: "2026-08-18",
    date: "2026-08-18",
    label: "Aug 18",
    goal: "Document V1 wiki structure, CAD assembly, and OD integration code.",
    workCompleted:
      "Lia: received Human Practices Info V1; reviewed award-winning hardware wikis for patterns (context → requirements → subsystems → experiments → results → reflection). Specified Tkinter setup (dark/blank OD), pump stop + PWM slider, JSON targets/commands, multi-Arduino power notes. Claire: CAD iterations — OD wiring space, vial holder cutouts, horizontal peristaltic pump drawers (vs vertical), breadboard slot; continued SoftWire OD classes (divide-by-zero expected on dummy values).",
    result:
      "V1 documentation outline and control UI requirements captured; mechanical layout shifted to horizontal pump drawers for shorter vial height.",
    nextStep: "Fill wiki V1 / Experiments tabs; finish OD setup/calibration code path; keep dashboard JSON protocol.",
    images: [
      {
        src: HW_IMG("journal/claire-cad-assembly-aug.avif"),
        alt: "August CAD assembly",
        caption: "CAD assembly / OD integration space — mid August.",
      },
      {
        src: HW_IMG("journal/claire-cad-pump-drawer-aug.avif"),
        alt: "Pump drawer CAD",
        caption: "Horizontal peristaltic pump drawer concept.",
      },
      {
        src: HW_IMG("journal/claire-od-integration-aug.avif"),
        alt: "OD integration notes",
        caption: "OD SoftWire / class rewrite notes.",
      },
    ],
    links: [
      {
        label: "Jira BIO board",
        href: "https://rebeccazoetam.atlassian.net/jira/software/projects/BIO/boards/2",
      },
    ],
  },
]

/** Newest first — Aug 18 at top, Mar 13 at bottom. */
export const HARDWARE_JOURNAL_ENTRIES = [...HARDWARE_JOURNAL_ENTRIES_RAW].sort((a, b) =>
  b.date.localeCompare(a.date)
)

/** @type {Record<string, HardwareJournalEntry>} */
export const HARDWARE_JOURNAL_BY_ID = Object.fromEntries(
  HARDWARE_JOURNAL_ENTRIES.map((e) => [e.id, e])
)

export function parseJournalHash(hash) {
  const raw = (hash || "").replace(/^#/, "")
  if (!raw.startsWith("journal-")) return null
  const id = raw.slice("journal-".length)
  return HARDWARE_JOURNAL_BY_ID[id] ? id : null
}

export function journalHashForDate(date) {
  return `journal-${date}`
}
