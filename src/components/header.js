import React, { useState } from "react"
import { Link } from "gatsby"
import PropTypes from "prop-types"

const Header = ({ siteTitle, menuLinks }) => {
  const [openMenu, setOpenMenu] = useState(null)

  return (
    <header style={{ background: "#0d4d5f"}}>
      <div
        style={{
          margin: "auto",
          maxWidth: 1200,
          padding: "30px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <h1 style={{flex: 1}}>
          <Link to="/" style={{ color: "white"}}>
            {siteTitle}
          </Link>
        </h1>

        <nav>
          <ul style={{ display: "flex", listStyleType: "none", margin: 0, padding: 0 }}>
            {menuLinks.map(link => (
              <li
                key={link.name}
                style={{ position: "relative", padding: "1rem" }}
                onMouseEnter={() => link.subLinks && setOpenMenu(link.name)}
                onMouseLeave={() => setOpenMenu(null)}
              >
              <Link style={{ color: "white", textDecoration: "none" }} to={link.link}>
                {link.name}
                {link.subLinks && <span style={{ marginLeft: "4px", fontSize: "0.7em" }}>▾</span>}
              </Link>

                {link.subLinks && openMenu === link.name && (
                  <ul
                    style={{
                      position: "absolute",
                      background: "#1c6a80",
                      padding: "0.5rem 0",
                      borderRadius: "4px"
                    }}
                  >
                    {link.subLinks.map(sub => (
                      <li key={sub.name}>
                        <Link
                          to={sub.link}
                          style={{
                            display: "block",
                            color: "white",
                            padding: "1rem",
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = "#2b999d")}
                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                        >
                          {sub.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  )
}

Header.propTypes = {
  siteTitle: PropTypes.string,
  menuLinks: PropTypes.array,
}

Header.defaultProps = {
  siteTitle: "",
  menuLinks: [],
}

export default Header