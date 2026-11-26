const bottomColors = {
  "/human-practices/": "#CDD7B8",
  "/human-practices/": "#CDD7B8",
  "/entrepreneurship/": "#7FE4AA",
  "/entrepreneurship/": "#7FE4AA",
  "/contribution/": "#769B8A",
  "/project/contribution/": "#769B8A",
  "/attributions/": "#EBB9A0",
  "/team/attributions/": "#EBB9A0",
  "/team/": "#94D0D2",
  "/engineering/": "#C9A379",
  "/project/engineering/": "#C9A379",
  "/safety/": "#588C7E",
  "/safety-and-security/": "#588C7E",
  "/finance/": "#FADECD",
  "/description/": "#000000",
  "/project/description/": "#000000",
  "/model/": "#805340",
  "/software/": "#805340",
  "/wiki/": "#FECC65",
  "/outreach/": "#D7AB6F",
  "/": "#296270",
}

const buttonColors = {
  "/": "#1BB4A8",
  "/project/description/": "#162568",
}

export function footerTheme(pagePath = "") {
  const path = pagePath ? `${pagePath.replace(/\/+$/, "")}/` : ""
  const bottom = path.startsWith("/hardware/") ? "#A39DCC"
    : path.startsWith("/dry-lab/") ? "#805340"
    : path.startsWith("/wet-lab/") ? "#98CC80"
    : bottomColors[path]
  const lightText = ["#296270", "#000000", "#805340"].includes(bottom)
  const button = buttonColors[path]
  return {
    bottom,
    text: bottom ? (lightText ? "#FFFFFF" : "#06202B") : undefined,
    button,
    buttonText: button ? (button === "#162568" ? "#FFFFFF" : "#06202B") : undefined,
  }
}
