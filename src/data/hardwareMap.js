/**
 * Photos in Past Iterations. Each part is a polygon in that photo's own
 * pixels and belongs to a subsystem (ids from HARDWARE_SUBSYSTEMS). Its
 * label sits at `label`, at the left edge, or at the right edge with
 * `align: "right"`. The summary opens under the label, or over it with
 * `tip: "up"` (low on the photo, it always does). `tipPlace: "top-left"`
 * pins that summary to the top-left of the photo. `tipPlace: "above-stand"`
 * pins it just above the final stand, in the middle of the photo, clear of
 * the probe, stirring, pumps, and the other popouts.
 *
 * The visible file is the clean photo. Polygons follow the highlighted
 * regions on the matching *ref* image.
 */
const COLOUR = {
  data: "#3d9df2",
  cad: "#9b6bff",
  power: "#f5a300",
  temperature: "#f2552c",
  stirring: "#e8509b",
  pumps: "#1bb39a",
  od: "#1aa6c4",
}

export const HARDWARE_MAPS = {
  "version-1": {
    src: "https://static.igem.wiki/teams/6187/wiki/team/hardwarev1.avif",
    size: [860, 1136],
    alt: "Version 1 of the bioreactor on a desk: a tablet, a blue vial holder, a breadboard with the optical-density sensors, a small power board, a stirring fan with a heater plate, and a peristaltic pump.",
    summaries: {
      data: "Sends data from the bioreactor to our software, and controls from the software back, through an easy-to-use interface.",
      cad: "The 3D-printed holder for the culture vial, with ports in its lid for tubing and sensors.",
      power: "Powers every component, including the 5 W heater and the 2.5 W pumps, from a power module shared with the Arduino.",
      temperature: "Heats the culture above room temperature and holds it there, so microorganisms that need the warmth can thrive.",
      stirring: "A low-cost brushless fan with magnets on its hub spins a magnetic stir bar inside the vial.",
      pumps: "Peristaltic pumps that dose liquid into and out of the bioreactor, at different speeds for different volumes.",
      od: "An LED shines through the vial onto two photodiodes: one reads the culture, and one watches the LED so drift in the light can be subtracted.",
    },
    parts: [
      {
        subsystem: "data",
        points: [[162, 192], [505, 192], [505, 441], [162, 441]],
        label: [175, 170],
      },
      {
        subsystem: "cad",
        points: [[351, 442], [373, 424], [430, 416], [449, 436], [489, 551], [445, 599], [340, 599]],
        label: [500, 470],
      },
      {
        subsystem: "od",
        points: [[363, 517], [477, 519], [470, 681], [365, 681]],
        label: [490, 590],
      },
      {
        subsystem: "power",
        points: [[8, 625], [70, 615], [148, 640], [140, 712], [60, 718], [8, 690]],
        label: [160, 660],
      },
      {
        subsystem: "stirring",
        points: [[80, 916], [155, 821], [223, 844], [259, 872], [197, 1007], [111, 971]],
        label: [275, 950],
        tip: "up",
      },
      {
        subsystem: "temperature",
        points: [[96, 872], [149, 822], [253, 825], [252, 856], [177, 921]],
        label: [20, 800],
        tip: "up",
      },
      {
        subsystem: "pumps",
        points: [
          [783, 740],
          [792, 746],
          [801, 760],
          [814, 766],
          [838, 772],
          [853, 774],
          [856, 778],
          [856, 860],
          [842, 868],
          [832, 876],
          [830, 888],
          [828, 896],
          [822, 901],
          [816, 899],
          [806, 886],
          [798, 872],
          [790, 862],
          [784, 862],
          [762, 862],
          [744, 861],
          [726, 856],
          [710, 850],
          [696, 846],
          [680, 844],
          [666, 845],
          [658, 841],
          [655, 833],
          [658, 826],
          [670, 823],
          [682, 815],
          [690, 803],
          [694, 794],
          [708, 791],
          [728, 789],
          [748, 787],
          [768, 784],
          [776, 772],
          [777, 744],
        ],
        label: [845, 700],
        align: "right",
        tip: "up",
      },
    ],
  },
  "version-2": {
    src: "https://static.igem.wiki/teams/6187/wiki/team/hardwarev2.avif",
    size: [1250, 956],
    alt: "Version 2 hardware: a 3D-printed base and vial, an optical-density sensor, a heater on its housing, a laptop running the controls, peristaltic pump heads, a power and relay board, and a stirring fan with magnets.",
    summaries: {
      data: "A clearer on-screen interface, with colour, tabs, and more room, so readings and controls are easier to use than the Version 1 command line.",
      cad: "The revised 3D-printed base and vial housing, shaped to hold the culture and keep stray light off the OD sensors.",
      od: "A photodiode on the vial housing. Stemma QT connectors replace the loose jumper wires, and normalized OD can be turned into OD600 automatically.",
      temperature: "Holds the set point with less overshoot: proportional heat while it warms up, then PID once the culture is close.",
      power: "A separate 9 V feed into the Arduino VIN pin, so the Nano stays up when the heater and pumps switch.",
      pumps: "Peristaltic pump heads that squeeze tubing to move liquid into and out of the vial.",
      stirring: "A brushless fan with two magnets on its hub, which spins the stir bar inside the vial.",
    },
    parts: [
      {
        subsystem: "cad",
        points: [[51, 504], [90, 426], [161, 365], [288, 348], [399, 393], [455, 479], [417, 609], [324, 685], [178, 704], [63, 617]],
        label: [40, 730],
        tipPlace: "top-left",
      },
      {
        subsystem: "od",
        points: [[142, 556], [245, 539], [260, 608], [150, 623]],
        label: [270, 570],
      },
      {
        subsystem: "data",
        points: [[820, 198], [820, 31], [1078, 34], [1078, 200]],
        label: [900, 360],
      },
      {
        subsystem: "temperature",
        points: [[430, 795], [531, 666], [659, 694], [671, 710], [588, 873], [443, 826]],
        label: [450, 640],
        tip: "up",
      },
      {
        subsystem: "pumps",
        points: [[817, 631], [858, 583], [902, 599], [919, 636], [908, 672], [881, 693], [819, 676]],
        label: [700, 640],
      },
      {
        subsystem: "pumps",
        points: [[992, 558], [1021, 475], [1115, 488], [1118, 568], [1071, 588]],
        label: [1120, 450],
        align: "right",
      },
      {
        subsystem: "power",
        points: [[726, 749], [878, 724], [940, 876], [775, 920]],
        label: [620, 830],
        tip: "up",
      },
      {
        subsystem: "stirring",
        points: [[1040, 822], [1119, 787], [1170, 876], [1086, 916]],
        label: [1030, 760],
        align: "right",
        tip: "up",
      },
    ],
  },
  "version-3": {
    src: "https://static.igem.wiki/teams/6187/wiki/team/hardwarefinal.avif",
    size: [676, 732],
    alt: "The final bioreactor in use: a laptop, a culture vial with a temperature probe, a power module, a detail of the heater assembly, the 3D-printed stand, and a close-up of the optical-density sensor.",
    summaries: {
      data: "The laptop screen that shows bioreactor readings and sends controls back to the hardware.",
      cad: "The 3D-printed stand that holds the vial, the sensors, and the rest of the assembly.",
      power: "The bench supply for the bioreactor, with a small readout so the rail can be checked while it runs.",
      temperature: "A probe in the culture, and the heater in the detail photo, holding the vial above room temperature.",
      pumps: "The peristaltic pump beside the stand, dosing liquid into and out of the vial.",
      od: "Photodiodes on the housing that read how much light the culture lets through.",
      stirring: "The magnetic stirrer on the stand, which turns a stir bar inside the vial.",
    },
    parts: [
      {
        subsystem: "cad",
        points: [[253, 546], [293, 459], [457, 477], [489, 559], [490, 682], [253, 687]],
        label: [160, 640],
        tipPlace: "above-stand",
      },
      {
        subsystem: "data",
        points: [[522, 18], [636, 140], [498, 298], [428, 155]],
        label: [660, 40],
        align: "right",
      },
      {
        subsystem: "power",
        points: [[525, 382], [597, 295], [660, 310], [660, 341], [607, 410]],
        label: [530, 270],
      },
      {
        subsystem: "temperature",
        points: [[65, 421], [218, 418], [220, 554], [66, 554]],
        label: [20, 400],
      },
      {
        subsystem: "temperature",
        points: [
          [422, 254],
          [450, 250],
          [446, 268],
          [434, 280],
          [428, 296],
          [424, 312],
          [420, 328],
          [416, 344],
          [411, 360],
          [407, 376],
          [403, 390],
          [391, 392],
          [395, 376],
          [399, 360],
          [404, 344],
          [408, 328],
          [412, 312],
          [417, 296],
          [421, 280],
          [424, 268],
        ],
        label: [262, 288],
      },
      {
        subsystem: "od",
        points: [[539, 461], [675, 461], [675, 614], [540, 614]],
        label: [660, 440],
        align: "right",
      },
      {
        subsystem: "pumps",
        points: [[377, 479], [407, 476], [424, 507], [419, 524], [382, 524]],
        label: [430, 470],
      },
      {
        subsystem: "stirring",
        points: [[320, 582], [323, 563], [361, 568], [357, 592]],
        label: [240, 575],
        tip: "up",
      },
      {
        subsystem: "od",
        points: [[276, 538], [316, 548], [325, 577], [310, 588], [280, 590]],
        label: [230, 510],
      },
      {
        subsystem: "od",
        points: [[371, 534], [388, 536], [385, 578], [371, 577]],
        label: [400, 560],
      },
    ],
  },
}

/** Version 1, for anything still expecting a single map. */
export const HARDWARE_MAP = HARDWARE_MAPS["version-1"]

/** Each subsystem's colour on the photos. Summaries live on each version. */
export const HARDWARE_MAP_COLOURS = COLOUR
