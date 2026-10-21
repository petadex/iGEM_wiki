// One file per DBTL cycle, named after the engineering write-up it carries
// (A1.1, B2.4, Cycle E). Keep these arrays in the same order as the
// `versionLabels` for each team in src/data/engineeringCycles.js.
import WetLabA11 from "../../content/wiki/project/engineering/wet-lab/_version-1.mdx"
import WetLabA12 from "../../content/wiki/project/engineering/wet-lab/_version-2.mdx"
import WetLabA21 from "../../content/wiki/project/engineering/wet-lab/_version-3.mdx"
import WetLabA22 from "../../content/wiki/project/engineering/wet-lab/_version-4.mdx"
import WetLabA3 from "../../content/wiki/project/engineering/wet-lab/_version-5.mdx"
import DryLabB11 from "../../content/wiki/project/engineering/dry-lab/_version-1.mdx"
import DryLabB12 from "../../content/wiki/project/engineering/dry-lab/_version-2.mdx"
import DryLabB21 from "../../content/wiki/project/engineering/dry-lab/_version-3.mdx"
import DryLabB22 from "../../content/wiki/project/engineering/dry-lab/_version-4.mdx"
import DryLabB23 from "../../content/wiki/project/engineering/dry-lab/_version-5.mdx"
import DryLabB24 from "../../content/wiki/project/engineering/dry-lab/_version-6.mdx"
import HardwareC11 from "../../content/wiki/project/engineering/hardware/_version-1.mdx"
import HardwareC12 from "../../content/wiki/project/engineering/hardware/_version-2.mdx"
import HardwareC13 from "../../content/wiki/project/engineering/hardware/_version-3.mdx"
import HardwareC14 from "../../content/wiki/project/engineering/hardware/_version-4.mdx"
import VentureD1 from "../../content/wiki/project/engineering/entrepreneurship-outreach/_version-1.mdx"
import VentureD2 from "../../content/wiki/project/engineering/entrepreneurship-outreach/_version-2.mdx"
import VentureD3 from "../../content/wiki/project/engineering/entrepreneurship-outreach/_version-3.mdx"
import FullTeamCycleE from "../../content/wiki/project/engineering/full-team/_version-1.mdx"

export const ENGINEERING_CONTENT = {
  "hardware": [HardwareC11, HardwareC12, HardwareC13, HardwareC14],
  "dry-lab": [DryLabB11, DryLabB12, DryLabB21, DryLabB22, DryLabB23, DryLabB24],
  "wet-lab": [WetLabA11, WetLabA12, WetLabA21, WetLabA22, WetLabA3],
  "entrepreneurship-outreach": [VentureD1, VentureD2, VentureD3],
  "full-team": [FullTeamCycleE],
}
