/**
 * Design outreach sketchbook — sections (colored tabs) + ordered pages.
 *
 * Optional per spread or notes page:
 * - imageSrc / imageAlt / caption — single hero image
 * - imagePlaceholder — label shown when imageSrc is missing
 * - sectionId — which tab this page belongs to
 * - tocHalf — "left" | "right" for the two-page table of contents
 *
 * A section's `color` labels its pages; `tabColor` is its painted tab's, for
 * the table of contents. `tabImage` is that section's cut tab, shown whole.
 *
 * With showCover + landscape, spreads are [0], [1,2], [3,4], …
 * Each section starts on a LEFT page and has an even number of pages (see
 * buildSketchbookPages), so two different section tabs never share one open
 * spread. Extra pages can show one image (imageSrc) or a gallery (images,
 * with cols).
 */

/** Images uploaded from the team's Discord and Drive. */
const NB_IMG = (name) =>
  `https://static.igem.wiki/teams/6187/wiki/outreach/notebook/${name}.avif`
/** Images from the web design team's sketchbook write-up. */
const SK_IMG = (name) =>
  `https://static.igem.wiki/teams/6187/wiki/outreach/sketchbook/content/${name}.avif`
/** Seven painted strips in one CDN image; crop in CSS without local assets. */
const TAB_SHEET = "https://static.igem.wiki/teams/6187/wiki/outreach/sketchbook/new-tabs.avif"
const SK_TAB = (top, height) => ({
  tabImage: TAB_SHEET,
  tabBackgroundSize: `${2360 / 390 * 100}% ${1640 / height * 100}%`,
  tabBackgroundPosition: `${1472 / (2360 - 390) * 100}% ${top / (1640 - height) * 100}%`,
})
/** A gallery's images: [file name, alt text] pairs. */
const gallery = (...images) => images.map(([name, alt, caption]) => ({ src: SK_IMG(name), alt, caption }))
/**
 * A tall, thin picture as gallery pieces side by side: columns [x0, x1] of it
 * (its `size` [w, h]) cut at `rows` [[y0, y1], …], so it shows bigger.
 */
const splitImage = (name, alt, size, [x0, x1], rows) =>
  rows.map(([y0, y1]) => ({ src: SK_IMG(name), alt, crop: [x0, y0, x1, y1], size }))

/** One of a section's extra pages: a few lines and an image or a gallery. */
const sectionPage = (sectionId, id, title, fields) => ({
  id: `${sectionId}-${id}`,
  title,
  sectionId,
  density: "soft",
  variant: "notes",
  ...fields,
})

export const DESIGN_SKETCHBOOK_SECTIONS = [
  {
    id: "web-design",
    ...SK_TAB(478, 116),
    label: "Web Design",
    color: "#3B82A0",
    tabColor: "#bb5952",
    progress: "",
    startPageId: "web-design",
  },
  {
    id: "animation",
    ...SK_TAB(594, 113),
    label: "Animation",
    color: "#E07A3A",
    tabColor: "#da6b5c",
    progress: "",
    startPageId: "animation",
  },
  {
    id: "character-design",
    ...SK_TAB(707, 113),
    label: "Character Design",
    color: "#5A9E4B",
    tabColor: "#e89469",
    progress: "",
    startPageId: "character-design",
  },
  {
    id: "social",
    ...SK_TAB(822, 113),
    label: "Social",
    color: "#C45B8C",
    tabColor: "#f0b376",
    progress: "",
    startPageId: "social",
  },
  {
    id: "branding",
    ...SK_TAB(935, 113),
    label: "Branding",
    color: "#7B5EA7",
    tabColor: "#ebd188",
    progress: "",
    startPageId: "branding",
  },
  {
    id: "merchandise",
    ...SK_TAB(1048, 113),
    label: "Merchandise",
    color: "#98623D",
    tabColor: "#acbc8a",
    progress: "",
    startPageId: "merchandise-cards",
  },
  {
    id: "video",
    ...SK_TAB(1164, 115),
    label: "Video",
    color: "#8A8680",
    tabColor: "#6e9fb0",
    progress: "",
    startPageId: "video",
  },
]

/** The right-hand page of a section's spread: one more image from the season. */
function sectionSnapshotPage(sectionId, image, caption, alt) {
  return {
    id: `${sectionId}-notes`,
    title: "Snapshots",
    sectionId,
    density: "soft",
    variant: "notes",
    imageSrc: NB_IMG(image),
    imageAlt: alt,
    caption,
  }
}

export const DESIGN_SKETCHBOOK_PAGES = [
  {
    id: "cover",
    title: "Design Team Sketchbook",
    subtitle: "iGEM Toronto 2026",
    density: "hard",
    variant: "cover",
    coverImage: "https://static.igem.wiki/teams/6187/wiki/outreach/sketchbook/front-cover.avif",
    coverAlt: "Design Team Sketchbook front cover",
    coverCanvas: [2360, 1640],
    coverCrop: [993, 428, 1594, 1542],
  },
  {
    id: "toc-left",
    title: "Contents",
    subtitle: "Jump to a section",
    density: "soft",
    variant: "toc",
    tocHalf: "left",
  },
  {
    id: "toc-right",
    title: "Contents",
    subtitle: "Continued",
    density: "soft",
    variant: "toc",
    tocHalf: "right",
  },
  {
    id: "web-design",
    title: "Web Design",
    sectionId: "web-design",
    body:
      "For wiki concepts, at the very start the team pooled together all their personal ideas on what aesthetic the wiki should have,\n\nA lot of our early concepts featured a pixel artstyle as we wanted to play into the ‘pokemon’-like and gamey aspects of the project. However, we entertained the idea of a hand-drawn style as well,",
    density: "soft",
    variant: "spread",
    // Cut in two side by side, between the PETadex screen and the projects.
    images: splitImage(
      "web-hand-drawn-concept",
      "A tall early mockup in a hand-drawn concept-art style, with a pixel title reading Name TBA",
      [246, 1600],
      [0, 246],
      [
        [0, 862],
        [862, 1600],
      ],
    ),
    cols: 2,
    caption: "An early hand drawn concept with concept art style graphics by Kathleen",
  },
  sectionPage("web-design", "pixel", "Early concepts", {
    // The two wide ones across the page, one over the other, then the two
    // tall ones side by side.
    images: [
      ...gallery(
        ["web-early-concept-peta-play", "Pixel-art landing page titled PETA PLAY with an arcade machine"],
        ["web-early-concept-pet-apult", "Pixel-art landing page titled PET-APULT on a purple sunset"],
      ).map((image) => ({ ...image, span: 2 })),
      ...gallery(
        ["web-early-concept-gallery", "A pastel pixel-art mockup with card-like panels"],
        ["web-early-concept-igem-to", "A busy collage-style page titled iGem TO with plastic-degrading enzymes"],
      ),
    ],
    cols: 2,
    rows: [1, 1, 1.5],
    caption: "Early pixel style concepts for the wiki by Hillary, Ibi, Wineta and Sara P respectively",
  }),
  sectionPage("web-design", "biomes", "Biomes", {
    body:
      "Another concept we also thought about was integrating biomes into our design as the effects of microplastics reaches many aspects of our environments and lives. It is also related to our pokemon inspired concept of different gyms and regions, similar to the games. This is where we decided to depict the different petases as pokemon, similar to collecting pokemon from a pokedex, the concept was that we invite the user to collect different petases from the petadex.",
    imageSrc: SK_IMG("web-environment-petamon-concept"),
    imageAlt: "A pixel forest scene with a PETamon, a speech bubble and an info box",
    caption: "An early proposal for an environment + petamon concept by Cindy",
  }),
  sectionPage("web-design", "vote", "The vote", {
    body:
      "The team put a vote on the ideas and the winner was both the hand drawn concept and the environmental concept, so a proof of concept merging the two styles was made which pushed our wiki style going forward,",
    imageSrc: SK_IMG("web-first-environment-concept-kathleen"),
    imageAlt: "A hand-drawn teal wave over a beach, with the words Why plastic is bad and PETases",
    caption: "The first concept of the environment + hand drawn style by Kathleen",
  }),
  sectionPage("web-design", "storyboard", "Storyboard", {
    body:
      "Kathleen produced the first storyboard of the compositional flow of the wiki homepage, which is the basis of the current homepage!",
    // Trimmed to the drawing and cut in two between sections 3 and 4.
    images: splitImage(
      "wiki-concept",
      "A long pencil outline of the homepage, with numbered sections and notes",
      [740, 4000],
      [31, 686],
      [
        [31, 1945],
        [1945, 3984],
      ],
    ),
    cols: 2,
    caption:
      "The first outline for the homepage separated into sections for different artists on the web design team to work on",
  }),
  sectionPage("web-design", "story", "A story to scroll", {
    body:
      "Originally the main concept was to have every subteam represent a PETamon gym, each subteam would have a trainer and a petamon partner, however along the way we scrapped the trainer concept as not enough people on the team was comfortable drawing humans.\n\nThe idea was our wiki would have a story flowing through where you can follow the journey of  a bottle breaking down into microplastics by the end of the page. We wanted to take the users  on a journey through toronto while still communicating the idea of our project .",
    imageSrc: SK_IMG("web-section-1-draft-kathleen"),
    imageAlt: "A painted draft of the homepage's top: the PetaBite title over a plaza and waterfall",
    caption:
      "First draft of section 1 of the homepage by Kathleen",
    captionLink: {
      href: "https://drive.google.com/file/d/128VEt_m71F73DCxGbCPZX32m_PKXF5xI/view?usp=drive_link",
      label: "Video concept of animations for section 1 by Kathleen",
    },
  }),
  sectionPage("web-design", "drafts", "First drafts", {
    images: gallery(
      ["web-section-2-draft-noorine", "A tall painted draft of the waterfall and river, with three condition cards", "First draft of section 2 of the homepage"],
      ["web-section-4-draft-cindy", "A red battle screen sketch reading This PETase is ready for battle, and a sketch of a cat at a tablet", "First draft of section 4 (that used to be for homepage but was moved to dry lab) by Cindy"],
    ),
  }),
  sectionPage("web-design", "iteration", "Next iteration", {
    images: gallery(
      ["web-sections-1-3-iteration", "The homepage's first three sections painted top to bottom", "Next iteration of section 1-3 of the wiki by Kathleen"],
      ["web-section-3-4-noorine", "The lab wall with its night-sky window, shelves and a blue tube", "Section between 3 and 4, representing the technical subteams"],
    ),
  }),
  sectionPage("web-design", "petamon", "PETamon at work", {
    body:
      "We finally finalized  all  the petamon designs for each team, for more information on the designs refer to the character concepts tab. We originally wanted to do a normal navigation menu at the bottom of the page with an icon for each team (originally it was the trainers but the trainers got scrapped somewhere along the process. But then  we had the  idea to  have each petamon breaking down a section  of a bottle since  petamons main abilities are to break down plastics! Now the petamons populate our wiki breaking down microplastics as they go.",
    images: gallery(
      ["web-sections-4-5-plant", "The treatment plant's tanks and pipe pouring into the sea"],
      ["web-sections-4-5-ocean", "The deep ocean with coral and the PETamon around a broken bottle"],
    ),
    caption: "Sections 4 and 5 of the wiki’s homepage.",
  }),
  sectionPage("web-design", "subpages", "Subteam pages", {
    body:
      "The web team worked hard to make sure all  the animations brought the page to life and kept everything interactive . Each subpage was illustrated  with a different  theme matching  the  sub page!\n\nFor the subteam pages, wet lab who had an axolotl-catfish had an ocean theme, dry lab with a spider-crab-scorpion petamon had a desert/archeology theme, Hardware  has a steel turtle in deep caves, Outreach has a squirrel with a beret (very french and artistique!), venture with its kangaroo and a pouch of gold, web has a fire dragon with its volcano, and  human practices has a dove flying in the sky",
    variant: "aside",
  }),
  sectionPage("web-design", "subpages-images", "Subteam pages", {
    variant: "image",
    // The two drafts one over the other, the tall Wet Lab page down the right.
    images: [
      ...gallery(["web-outreach-page-draft-meghan", "A draft of the Outreach page: an autumn forest around a white text box", "Draft of outreach subteam page by Meghan"]),
      ...gallery(["web-wet-lab-page-cindy", "The finished Wet Lab page: a sunset sea around a white text box", "Finished  Wet lab subteam page by Cindy"]).map(
        (image) => ({ ...image, rowSpan: 2 }),
      ),
      ...gallery(["web-entrepreneurship-page-draft-noorine", "A draft of the Entrepreneurship page", "draft of entrepreneurship page"]),
    ],
    cols: 2,
  }),
  sectionPage("web-design", "other-pages", "Other pages", {
    body:
      "As for the non subteam pages, the web design team had a lot of fun thinking of different environments! Theres also a Gemy easter egg in the project description page",
    images: gallery(
      ["web-project-page-kathleen", "The finished Project Description page: a night sky with a rocket over a planet", "Finished Project description page by Kathleen"],
      ["web-contribution-page-draft-noorine", "A draft of the Contribution page: sunlit stone steps in a greenhouse", "Draft of contribution page"],
    ),
  }),


  {
    id: "web-design-end",
    title: "The result",
    sectionId: "web-design",
    density: "soft",
    variant: "aside",
    body:
      "The final resulting product is the current website! We hope that our passion and storytelling is visible  through the wiki, the web design team had a lot of fun drawing  everything and we hope  our users have fun exploring our pages.",
  },
  {
    id: "animation",
    title: "Animation",
    sectionId: "animation",
    body:
      "The animation of our logo being cut on the  front home page and loading screens  were made by  Cindy so our branding would be more interactive!",
    density: "soft",
    variant: "spread",
    imageSrc: SK_IMG("animation-logo-cindy"),
    imageAlt: "The PetaBite logo: the letters P, e, t, a, B, i, t, e in a chain of molecule rings",
    caption: "Animation of the Petabite logo by Cindy",
  },
  sectionPage("animation", "storyboard", "Storyboard", {
    body:
      "For the promo video, the team wanted a 30 second animated segment with a  voice over in the background. After much discussion we opted  for drawing the assets as static images before animating them in after effects rather than frame by frame as we wanted to save time as much as we can. Ibi who was in charge of scripting wanted to maintain a Ted-ed inspired style for  the animation segment, with this in mind a storyboard was drafted up by Kathleen according to the script,",
    // Two side by side, the third under them.
    images: gallery(
      ["animation-storyboard-1", "Storyboard frames: a hand, the word Everywhere and fish"],
      ["animation-storyboard-2", "Storyboard frames of fish and shrimp, numbered shot by shot"],
      ["animation-storyboard-3", "Storyboard frames of a person eating, ending on a red heart"],
    ).map((image, i) => (i === 2 ? { ...image, span: 2 } : image)),
    cols: 2,
    caption: "Storyboard for the animation portion of the promo video by Kathleen",
  }),
  sectionPage("animation", "assets", "Assets", {
    body:
      "After the storyboard was finalized, all assets needed were broken down into different components so  different members can work on drawing them.",
    // One over the other; the anemones trimmed to where they're painted.
    images: [
      ...gallery(["animation-asset-anemone-angirmaa", "A row of painted anemones and coral", "One of the assets : Anemone by Angirmaa"]).map((image) => ({
        ...image,
        crop: [0, 380, 1280, 720],
        size: [1280, 720],
      })),
      ...gallery(["animation-asset-water-sara", "A painted underwater background with bubbles", "One of the assets : background water by Sara P"]),
    ],
    cols: 1,
    rows: [1, 3.2],
  }),
  sectionPage("animation", "wip", "In progress", {
    body:
      "Once all  assets were finished, they were all animated in after effects to produce the animation segment in the final promo video.",
    images: gallery(
      ["animation-wip-1", "After Effects with the word Everywhere on screen", "Work in progress shot of the promo video animation by Kathleen"],
      ["animation-wip-2", "After Effects with an animated person eating", "Another Work in progress shot of the promo video by Kathleen"],
    ),
    cols: 1,
  }),
  {
    id: "character-design",
    title: "Character Design",
    sectionId: "character-design",
    body: "Once we established that we wanted each subteam to have their own petamon and trainer mascots (trainers are now scrapped). We iterated that there would be no AI used in any artwork, including character designs. Our first petamon and trainer design was made for wet lab as a proof of concept and to get the ball rolling.\n\nFor the petamon, we played into the structure of a PET molecule, which is why the axolotl catfish has oxygen ball molecules on its fins and tail (plus hydrogen). We thought to make it a water type (because ‘wet’ lab) but also electric like how enzymes speed up reactions! After this design, all our future petamon designs also play into their petase aspects and consume plastics for sustenance. Its mustache was a reference to a catfish but also ended up making it look French (said by the petabite team).",
    density: "soft",
    variant: "text",
  },
  sectionPage("character-design", "wet-lab", "Wet Lab", {
    variant: "image",
    imageSrc: SK_IMG("character-wet-lab-draft-kathleen"),
    imageAlt: "Sketches of an axolotl mascot with notes",
    caption: "Draft of Wet Lab mascot by Kathleen",
  }),
  sectionPage("character-design", "trainer", "Trainers", {
    variant: "aside",
    body: "The wet lab trainer was designed to communicate a scientist character archetype, she  was drawn to have a sense of fashion as seen by her dress like lab coat and earrings while still maintaining proper PPE of goggles, gloves and pants as well as covered shoes and always tying her hair up in the lab. Sadly the trainer mascots were scrapped but we had initial ideas of drawing Hardware as an engineer with either a mechanical wheelchair or prosthetics,  dry lab being an archeologist explorer who uncovers new petamons (petases),  and much more. Dry lab trainer is still on our homepage, he is the explorer in the forest section, he was not removed because we liked the animation of that section and thought it would be a shame to remove him.",
  }),
  sectionPage("character-design", "trainer-images", "Trainers", {
    variant: "image",
    images: gallery(
      ["character-wet-lab-trainer-kathleen", "Turnaround of a Wet Lab trainer in a lab coat", "Wet Lab trainer mascot (before the trainer concepts got scrapped) by Kathleen"],
      ["character-wet-lab-mascot-kathleen", "The Wet Lab mascot: a pink and yellow axolotl with its mouth open", "Wet  lab mascot by Kathleen"],
    ),
    cols: 1,
  }),
  sectionPage("character-design", "mascots", "Human Practices", {
    body:
      "The human practices mascot was designed as a dove to reference the nature of their work. We thought their mascot would do nicely with a light and muted palette as well as molecule details all around it.",
    imageSrc: SK_IMG("character-hp-mascot-ibi"),
    imageAlt: "The Human Practices dove mascot, front and side views",
    caption: "Human Practices mascot by Ibi",
  }),
  sectionPage("character-design", "outreach-venture", "Outreach and Venture", {
    body:
      "The following are the mascot designs for outreach and venture, venture is a kangaroo with a pouch of gold coins which is pretty self explanatory! Venturoo also has hydrogen and oxygen details around it. Funfact if you hover on the petamons on each subteam page they all have unique animation, venturoo spits out a bunch of coins while outreach gets hit by a stray acorn. For outreach we updated the design so it had an acorn beret to reference artists as well as to make it more french (said the Petabite team).  This updated design can be seen at the bottom of this subteam page!",
    images: gallery(
      ["character-outreach-mascot-anastasia", "The Outreach mascot: a pink squirrel with a purple tail", "Outreach Mascot by Anastasia"],
      ["character-venture-mascot-noorine", "A draft of the Venture kangaroo mascot with a colour palette", "Draft of venture mascot"],
    ),
    cols: 1,
  }),
  sectionPage("character-design", "dry-lab", "Dry Lab", {
    body:
      "The dry lab mascot is  a spider crab scorpion fusion as dry lab requested they wanted a web and bug like theme. Outreach thought it would be cute if they carried around a bottle cap hat on their heads similar to hermit crabs with its  shell. It would break down plastics to  get access to the caps that they’ll use as a shell, recycling style!",
    imageSrc: SK_IMG("character-dry-lab-mascot-kathleen"),
    imageAlt: "The Dry Lab mascot: a dark spider crab wearing a teal bottle cap",
    caption: "Dry  lab mascot by Kathleen",
  }),
  sectionPage("character-design", "rebecca", "Mascots", {
    body:
      "A fire snake was designed for Web and a steel turtle (whom we named Gary) was made for hardware. We thought the steel electric typing for Gary was quite accurate to the nature of Hardware’s work!",
    images: gallery(
      ["character-web-mascot-rebecca", "The Web mascot: a fire snake", "Web mascot by Rebecca"],
      ["character-hardware-mascot-rebecca", "The Hardware mascot: a steel turtle crackling with lightning", "Hardware mascot by Rebecca"],
    ),
    cols: 1,
  }),
  sectionPage("character-design", "crochet", "Crochet", {
    imageSrc: SK_IMG("crochet"),
    imageAlt: "Isabella creating a crochet pattern for our Wet Lab PETamon",
    caption: "Isabella creating a crochet pattern for our Wet Lab PETamon.",
    body:
      "Crochet Character Designs: Bringing our Petamon to life beyond the digital world, we are working on designing crochet patterns. While the Wet Lab Axolotl is first on our list to become a precious plushie, we plan on creating patterns for all of our Petamon so that anyone can make one for their own home.",
  }),
  {
    id: "social",
    title: "Social",
    sectionId: "social",
    body:
      "Our social media team launched the PetaBite initiative with our first Instagram post; our project introduction post. It garnered more than 11.4K views, 300 engagements, and more than 15 comments since it was first posted on May 21st.",
    density: "soft",
    variant: "spread",
    imageSrc: NB_IMG("social-project-intro-may"),
    imageAlt: "Instagram slide titled Plastic pollution on the rise, with an axolotl and facts about microplastics in the body",
    caption: "",
  },
  sectionSnapshotPage(
    "social",
    "social-petadex-post-may",
    "",
    "Instagram slide titled Our project: the PETadex, with an axolotl holding a bottle"
  ),
  sectionPage("social", "visuals-reels", "Our visual identity and reels", {
    variant: "aside",
    body:
      "To adhere to the earthy colour narrative laid down by our wiki’s design team, a pastel palette was built with visual elements showcasing Wet Lab’s axolotl PETamon, the very first PETamon designed in this project cycle. Throughout the summer, the Road to Jamboree reel series documented various subteams at work, following their contributions towards the final PetaBite project.",
  }),
  sectionPage("social", "waterfront", "The Waterfront", {
    imageSrc: SK_IMG("newsletter"),
    imageAlt: "The Waterfront newsletter",
    body:
      "Monthly editions of the iGEM Toronto newsletter, The Waterfront, were sent out to our general members beginning late May, featuring progress on the PetaBite project, current and prospective events, and a snapshot of the current microplastics and PETase landscape. A special edition was sent out to our subscribers showcasing the speakers invited to the Microplastics Conference in August.",
  }),
  {
    id: "branding",
    title: "Branding",
    sectionId: "branding",
    body:
      "Our vision for the PetaBite brand featured designs made of earthy tones, textured brushes, and an entirely hand-drawn visual style. No generative AI was used to create elements that were incorporated into PetaBite’s brand image since the beginning of the project cycle. During May, iGEM Toronto hosted a logo design competition where members (both inside and outside of the outreach team) could submit designs inspired by our visual direction for PetaBite, which was inspired by a Pokémon x synthetic biology theme.",
    density: "soft",
    variant: "spread",
    imageSrc: SK_IMG("branding-logo-submission-3"),
    imageMaxWidth: 192,
    imageAlt: "A magnifying glass over a red PET molecule",
    caption: "",
  },
  sectionPage("branding", "submissions", "Logo competition", {
    // The two round ones side by side, then the other two across the page,
    // one over the other.
    images: [
      ...gallery(
        ["branding-logo-submission-1", "A round logo with a fluffy PETamon and the word PetaBite in vines"],
        ["branding-logo-submission-2", "A red round logo with a PET molecule inside"],
      ),
      ...gallery(
        ["branding-logo-submission-petadex", "The word PETadex in blue between two circuit-board icons"],
        ["branding-logo-winner-chinmay", "The word PETadex framing a PET molecule, with scissors cutting a bond"]
      ).map((image) => ({ ...image, span: 2 })),
    ],
    cols: 2,
    rows: [1, 0.4, 0.6],
    galleryMaxHeight: "min(36rem, 120cqw)",
    galleryGap: "1rem",
    caption: "Various submissions for the PetaBite logo design competition.",
  }),
  sectionPage("branding", "winner", "The winning design", {
    body:
      "The winning design featured “PETadex” framing the molecular structure of PET (prepared by Chinmay), and was stylistically reworked by Cindy to better capture the wiki’s developing visual direction. To accommodate the CMYK colour palette that was used to design the team’s merchandise, it was recoloured in September.",
    images: gallery(
     ["branding-logo-rework-cindy", "The PetaBite logo: pastel letters in a chain of molecule rings", "Winning design reworked to suit the wiki’s narrative theme by Cindy."],
    ),
    cols: 1,
    galleryMaxHeight: "min(16rem, 60cqw)",
  }),
  sectionPage("branding", "earth-tones", "Everywhere", {
    body:
      "The prevalence of earth-tone colours remained consistent in every facet of PetaBite’s branding — including promotional materials for events and slide decks developed for competitions by the entrepreneurship and human practices subteams.",
    images: gallery(
      ["branding-conference-logo-cindy", "A bottle-shaped logo reading UofT Microplastics Conference 2026 around the CN Tower", "Logo of the UofT Microplastics Conference designed by Cindy."],
      ["branding-petascale-deck", "A title slide reading PetaScale: PET-microplastic degradation at scale", "A comprehensive pitch deck showcasing the business development arm of PetaBite, PetaScale, created by members of our entrepreneurship team."],
    ),
    // One over the other.
    cols: 1,
  }),
  sectionPage("merchandise", "cards", "Petabite Trading Cards", {
    images: gallery(
      ["merch-card-1", "A PETase item card"],
      ["merch-card-2", "An Incinerator item card"],
      ["merch-card-3", "A pollution card with a plastic bottle in the sea"],
      ["merch-card-4", "A pollution card with a fork and knife in a forest"],
      ["merch-card-5", "Reactoise, a turtle PETamon card"],
      ["merch-card-6", "A PETamon card in a lab"],
    ),
    // In pairs, so each shows bigger.
    cols: 2,
    caption: "Petabite trading card designs designed by various members of iGEM Toronto.",
  }),
  sectionPage("merchandise", "printed", "Petabite Trading Cards", {
    imageSrc: SK_IMG("merch-cards-printed"),
    imageAlt: "A row of printed PetaBite trading cards",
    caption: "Printed PetaBite trading cards, displayed at the UofT Microplastics Conference.",
  }),
  sectionPage("merchandise", "merch", "PetaBite Apparel", {
    body:
      "Outreach created merchandise that encapsulates the scale of the microplastics problem, and integrates it with PetaBite’s north star goal: delivering plastic-degrading enzymes that are capable of functioning in a variety of environments. Initial designs featured an enlarged version of the PetaBite logo present on the back of apparel, with iGEM Toronto’s own logo printed on the front. These initial designs were revised to incorporate stylistic depictions of our solution. Upon revision, three articles of clothing were redesigned and ultimately finalized for merchandise production; a stonewashed t-shirt, a generic iGEM Toronto quarter zip, and a forest-green hoodie with sponsors displayed in the design. The t-shirt and the hoodie both featured PetaBite-specific designs.",
    imageSrc: SK_IMG("merch-catalogue-initial"),
    imageAlt: "The first merch catalogue: black t-shirts, hoodies and quarter zips",
    caption: "Initial iGEM Toronto merch catalogue — a t-shirt, hoodie, and quarter zip design.",
  }),
  sectionPage("merchandise", "redesign", "PetaBite Apparel", {
    body:
      "The team envisioned merch designs that were more representative of the art direction that shaped the homepage of the PetaBite wiki. After the first design iteration, members of the web design team were appointed to create apparel that could be worn beyond the Jamboree and iGEM-specific environments. Sponsors were initially going to be included on the sleeve of the hoodie, though the placement was adjusted and colours were homogenized to frame the rear design of the hoodie as seen in the finalized hoodie draft. The t-shirt redesign followed the same principle: emphasizing a modern, streetwear-style design. The base design is printed on top of a stonewash t-shirt base, and the finalized t-shirt design was selected out of a poll of four proposed designs.",
    imageSrc: SK_IMG("merch-tee-final"),
    imageAlt: "The final stonewashed tee, front and back",
    caption: "Finalized stonewashed tee designed by Kathleen (with inspiration from Abby).",
  }),
  sectionPage("merchandise", "tees", "PetaBite Apparel", {
    images: gallery(
      ["merch-tee-iteration-1", "A t-shirt design, front and back"],
      ["merch-tee-iteration-2", "A t-shirt design, front and back"],
      ["merch-tee-iteration-3", "A t-shirt design, front and back"],
      ["merch-tee-iteration-4", "A t-shirt design, front and back"],
    ),
    // One over the other: each is a wide front-and-back pair.
    cols: 1,
    caption: "Various iterations of the t-shirt design on a plain tee, designed by Kathleen (with inspiration from Abby).",
  }),
  sectionPage("merchandise", "final", "PetaBite Apparel", {
    images: gallery(
      ["merch-quarter-zip-final", "The final black quarter zip", "Finalized quarter zip design."],
      ["merch-hoodie-final", "The final forest-green hoodie, with sponsors framing the back design", "Finalized hoodie design."],
    ),
    cols: 1,
  }),
  sectionPage("merchandise", "making-petamon", "Crochet PETamon", {
    variant: "image",
    imageSrc: SK_IMG("makingpatemon"),
    imageAlt: "Isabella creating a crochet pattern for our Wet Lab PETamon",
    caption: "Isabella creating a crochet pattern for our Wet Lab PETamon.",
  }),
  sectionPage("merchandise", "crochet", "Crochet PETamon", {
    variant: "aside",
    body:
      "Bringing our Petamon to life beyond the digital world, we are working on designing crochet patterns. While the Wet Lab Axolotl is first on our list to become a precious plushie, we plan on creating patterns for all of our Petamon so that anyone can make one for their own home.",
  }),
  {
    id: "video",
    title: "iGEM Promotional video",
    sectionId: "video",
    body:
      "Scripting for iGEM’s two-minute promotional video began in June. The promo video aimed to provide a concise introduction to the microplastics problem, as well as a comprehensive summary of the experimental workflow that validates PetaBite’s technical pipeline, whilst remaining accessible to an audience with limited scientific knowledge. Filming took place at various locations across the University of Toronto campus and the City of Toronto, with an emphasis on the Toronto Islands. Edited to include voiceovers, animated scenes, external audio, the final promotional video was released publicly on August 11th.",
    density: "soft",
    variant: "spread",
    imageSrc: NB_IMG("other-promo-filming-jul26"),
    imageAlt: "A team member in a red shirt fishing off Centre Island with the Toronto skyline behind",
    caption: "",
  },
  {
    id: "video-presentation",
    title: "iGEM Presentation video",
    sectionId: "video",
    density: "soft",
    variant: "aside",
    body: "Preliminary planning for the 15-minute presentation video began in early September, with filming beginning mid-October.",
  },
  sectionPage("video", "still-wet", "iGEM Presentation video", {
    variant: "image",
    imageSrc: SK_IMG("still-wet"),
    imageAlt: "Still shots from the Wet Lab shooting session.",
    caption: "Still shots from the Wet Lab shooting session.",
  }),
  sectionPage("video", "still-hardw", "iGEM Presentation video", {
    variant: "image",
    imageSrc: SK_IMG("still-hardw"),
    imageAlt: "Still shots from the Hardware shooting session.",
    caption: "Still shots from the Hardware shooting session.",
  }),
  sectionPage("video", "still-ent", "iGEM Presentation video", {
    variant: "image",
    imageSrc: SK_IMG("still-ent"),
    imageAlt: "Still shots from the Entrepreneurship shooting session.",
    caption: "Still shots from the Entrepreneurship shooting session.",
  }),
  sectionPage("video", "still-hp", "iGEM Presentation video", {
    variant: "image",
    imageSrc: SK_IMG("still-hp"),
    imageAlt: "Still shots from the Human Practices shooting session.",
    caption: "Still shots from the Human Practices shooting session.",
  }),
  sectionPage("video", "presentation-context", "iGEM Presentation video", {
    variant: "aside",
    body: "Unlike the promotional video, the presentation video expanded on the scientific validity and rationale supporting PetaBite’s technical side, intended for an audience with an elevated understanding of synthetic biology and computational systems. Furthermore, validation of PetaBite’s real-world impact through stakeholder discussions, entrepreneurial analysis, and outreach efforts are documented in the presentation video. Scripting, shooting, and editing of the video took place during late October.",
  }),
  {
    id: "back",
    title: "That's the season",
    subtitle: "Flip back or tap a tab",
    body:
      "",
    density: "hard",
    variant: "back",
    coverImage: "https://static.igem.wiki/teams/6187/wiki/outreach/sketchbook/back-cover.avif",
    coverAlt: "Design Team Sketchbook back cover",
    coverCanvas: [2360, 1640],
    coverCrop: [386, 420, 998, 1574],
  },
]

/**
 * The pages as the book shows them, so none ever has to scroll. A page in
 * `split` (ids) has its text and its picture on separate pages (the page is
 * too small for both without shrinking the picture). A page in `breaks` runs
 * its text on over more pages, from each of those word indices. With `pairs`
 * (two pages open at once) a section that ends up with an odd number of
 * pages gets a closing notes page, so every section still starts on a left
 * page.
 */
export function buildSketchbookPages({ split = [], breaks = {}, pairs = false } = {}) {
  const pages = []
  let count = 0
  DESIGN_SKETCHBOOK_PAGES.forEach((page, i) => {
    const own = pageRun(page, split.includes(page.id), breaks[page.id] || [])
    pages.push(...own)
    if (page.sectionId) count += own.length
    // Two pages open at once: a section that ends up with an odd number of
    // pages gets a closing note, so the next still starts on a left page.
    const next = DESIGN_SKETCHBOOK_PAGES[i + 1]
    if (page.sectionId && next?.sectionId !== page.sectionId) {
      const section = DESIGN_SKETCHBOOK_SECTIONS.find((s) => s.id === page.sectionId)
      if (pairs && count % 2 === 1 && section) {
        pages.push({
          id: `${section.id}-progress`,
          title: "",
          body: "",
          sectionId: section.id,
          density: "soft",
          variant: "aside",
        })
      }
      count = 0
    }
  })
  return pages
}

/** One page as it's laid out: its text over as many pages as it needs, then its picture if split. */
function pageRun(page, isSplit, cuts) {
  if (!isSplit && !cuts.length) return [page]
  const { imageSrc, imageAlt, images, cols, rows, caption, captionLink, body, ...text } = page
  const words = String(body || "").split(/\s+/).filter(Boolean)
  const ends = [...cuts, words.length]
  const chunk = (k) => words.slice(k ? ends[k - 1] : 0, ends[k]).join(" ")
  const run = ends.map((_, k) => {
    if (k === 0) {
      return isSplit
        ? { ...text, body: chunk(0), variant: page.variant === "spread" ? "text" : "aside" }
        : { ...page, body: chunk(0) }
    }
    return {
      id: `${page.id}-more-${k}`,
      sectionId: page.sectionId,
      density: "soft",
      variant: "aside",
      title: continuedTitle(page),
      body: chunk(k),
    }
  })
  if (isSplit) {
    run.push({
      id: `${page.id}-image`,
      sectionId: page.sectionId,
      density: "soft",
      variant: "image",
      imageSrc,
      imageAlt,
      images,
      cols,
      rows,
      caption,
      captionLink,
    })
  }
  return run
}

/** The heading a page's run-on pages carry (see pageRun). */
export function continuedTitle(page) {
  return page.variant === "spread" ? "continued" : `${page.title}, continued`
}

/** Map section id → first page index in DESIGN_SKETCHBOOK_PAGES. */
export function getSectionStartIndex(sectionId) {
  const section = DESIGN_SKETCHBOOK_SECTIONS.find((s) => s.id === sectionId)
  if (!section) return -1
  return DESIGN_SKETCHBOOK_PAGES.findIndex((p) => p.id === section.startPageId)
}

/** Sections shown on the left vs right TOC page (3 + 3). */
export function getTocSections(half) {
  const mid = Math.ceil(DESIGN_SKETCHBOOK_SECTIONS.length / 2)
  if (half === "left") return DESIGN_SKETCHBOOK_SECTIONS.slice(0, mid)
  if (half === "right") return DESIGN_SKETCHBOOK_SECTIONS.slice(mid)
  return DESIGN_SKETCHBOOK_SECTIONS
}

/** StPageFlip / page-flip — https://github.com/Nodlik/StPageFlip (MIT, Copyright 2020 Nodlik) */
export const PAGE_FLIP_ATTRIBUTION = {
  name: "StPageFlip",
  author: "Nodlik (Oleg Litovski)",
  url: "https://github.com/Nodlik/StPageFlip",
  license: "MIT",
  npmPackage: "page-flip",
}
