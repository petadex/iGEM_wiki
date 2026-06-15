const React = require("react")

/**
 * Browsers still request /favicon.ico by default; we ship /favicon.svg and advertise it here.
 * Add static/favicon.ico later if you want to silence that specific request.
 */
exports.onRenderBody = ({ setHeadComponents }) => {
  setHeadComponents([
    React.createElement("link", {
      key: "favicon-svg",
      rel: "icon",
      href: "/favicon.svg",
      type: "image/svg+xml",
    }),
    <meta key="viewport" name="viewport" content="width=device-width, initial-scale=1.0" />
  ])
}
