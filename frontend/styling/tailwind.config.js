/* ============================================================
   Pitchy-AI — Tailwind Configuration
   ============================================================ */

tailwind.config = {

  darkMode: "class",

  theme: {
    extend: {

      /* ------ Colour Tokens ------ */
      colors: {
        "tertiary":                    "#ffb691",
        "secondary-fixed-dim":         "#c3c6cf",
        "secondary":                   "#c3c6cf",
        "on-tertiary":                 "#552000",
        "surface-container-lowest":    "#0c0e10",
        "surface-container-highest":   "#333537",
        "on-tertiary-fixed-variant":   "#783100",
        "on-primary-fixed-variant":    "#00468c",
        "primary-fixed":               "#d6e3ff",
        "outline":                     "#8a91a0",
        "error":                       "#ffb4ab",
        "on-error-container":          "#ffdad6",
        "on-tertiary-container":       "#4a1c00",
        "background":                  "#121416",
        "tertiary-container":          "#eb6a12",
        "surface-container":           "#1e2022",
        "on-secondary-container":      "#b8bcc4",
        "secondary-fixed":             "#dfe2eb",
        "secondary-container":         "#484c53",
        "on-secondary-fixed-variant":  "#43474e",
        "on-surface-variant":          "#c0c6d6",
        "surface-tint":                "#a9c7ff",
        "on-tertiary-fixed":           "#341100",
        "on-secondary-fixed":          "#181c22",
        "surface-dim":                 "#121416",
        "surface-variant":             "#333537",
        "error-container":             "#93000a",
        "on-primary-fixed":            "#001b3d",
        "inverse-primary":             "#005db7",
        "tertiary-fixed":              "#ffdbcb",
        "on-error":                    "#690005",
        "surface":                     "#121416",
        "primary-fixed-dim":           "#a9c7ff",
        "inverse-surface":             "#e2e2e5",
        "on-secondary":                "#2d3137",
        "surface-container-low":       "#1a1c1e",
        "outline-variant":             "#414754",
        "on-surface":                  "#e2e2e5",
        "surface-bright":              "#38393c",
        "primary":                     "#a9c7ff",
        "primary-container":           "#3c90ff",
        "on-primary-container":        "#002957",
        "surface-container-high":      "#282a2c",
        "on-background":               "#e2e2e5",
        "on-primary":                  "#003063",
        "inverse-on-surface":          "#2f3133",
        "tertiary-fixed-dim":          "#ffb691",
      },

      /* ------ Border Radius ------ */
      borderRadius: {
        DEFAULT: "1rem",
        lg:      "2rem",
        xl:      "3rem",
        full:    "9999px",
      },

      /* ------ Font Families ------ */
      fontFamily: {
        headline: ["Manrope"],
        body:     ["Inter"],
        label:    ["Inter"],
      },

    },
  },

};