# Unit 5: Act of Publishing — HTML & CSS for long-form writing

A self-paced, student-facing guide for BA Graphic Communication Design (Central Saint Martins, UAL). It teaches HTML and CSS for publishing the Unit 5 designed critical report as a website, building on the Unit 2 Computation brief.

- 12 Basics lessons (6 marked *Essential*: enough to publish) + 9 optional Advanced lessons (including Google Fonts and other font providers) + extras
- Every lesson is folded by default, showing its time and what students will make; a *Mark as done* button and a sidebar progress bar track progress in the student's browser
- A friendly, encouraging voice inspired by SuperHi's *Learn to Code Now*, with a "Stuck?" panel of the five usual mistakes
- A 15-minute Unit 2 recap (from the Computation *Obliteration* brief and slides), plus "From Unit 2" notes in the lessons that build on it
- Time estimates for every lesson, section and part
- A downloadable starter folder (`starter/my-critical-report.zip`) and a six-step "Your report" thread in the essential lessons, where students turn their own 600-word midpoint draft into a working website in Visual Studio Code
- "Show answers" drop-downs with explanations under every exercise
- A live HTML/CSS editor in every lesson, styled like VS Code's dark theme (edit, preview at phone width, reset, download as `index.html` / `style.css`)
- Hand-drawn SVG diagrams for each concept
- "Using AI in web design" note, including its environmental impact
- An Introduction group (How this guide works, Unit 2 recap, Using AI, Inspiration, Help & resources) before the three parts
- An Inspiration section: eight English-language long-form publications by KABK graphic design students (2015), each with what to look at and the lesson that teaches it
- Part 2 "Make it yours": three creative directions (minimal, editorial, experimental) and three challenges, followed by optional technique lessons
- "CSS instead of JavaScript" reference, and a help & resources section with troubleshooting answers (UAL Library, LinkedIn Learning via UAL login, MDN, debugging guide)
- Links to W3Schools and LinkedIn Learning for each topic

## Publishing on GitHub Pages

1. Create a new repository (e.g. `unit5-html-css`) and upload the contents of this folder.
2. **Settings → Pages → Deploy from a branch → `main` / root.**
3. The site appears at `https://<username>.github.io/unit5-html-css/`.

## Working offline

The site uses no external services. Fonts are in `/fonts` (Roboto, Roboto Mono and EB Garamond, all under the SIL Open Font License; see the licence files). Open `index.html` straight from the folder and everything works, including the live editors.

## Editing

| What | Where |
| --- | --- |
| Colours, fonts, layout | `css/site.css` — palette at the top: indigo `#1F0062` (main), blue `#0B78B3` (Part 1), indigo (Part 2), brown `#68150A` (Part 3), white page background. Red `#D73220` is used for warnings. Blue and red use darker `-deep` shades for text, for contrast. |
| Lessons, diagrams, starter code | `index.html` — each lesson is a `<section class="lesson">`; each live editor is a `<div class="playground">` holding `<textarea class="pg-src" data-lang="html">` and `data-lang="css"` |
| Editor behaviour, contents highlight, progress | `js/playground.js` |
| Exercise images | `images/` (sealand.jpg, dazzle-ship.jpg, collage-poster.jpg) |
| Starter folder for students | `starter/my-critical-report/` — edit it, then re-zip it as `starter/my-critical-report.zip` |

Inside a `pg-src` textarea, write code exactly as students should see it. The one exception is `&`, which must be written as `&amp;` (so `&ndash;` is typed `&amp;ndash;`).

LinkedIn Learning links use the UAL share links from the earlier Notion guide. The video titles named in lessons come from *HTML Essential Training (2020)* and *CSS Essential Training (2023)*, so check them against the course behind each link.

This guide combines and replaces the earlier Notion *Web Publishing Foundations Guide*, and builds on the work of Eric Schrijver and colleagues at the Royal Academy of Art, The Hague (KABK), who pioneered student-centred digital publishing.

---

Teaching materials developed for BA Graphic Communication Design, Central Saint Martins, University of the Arts London. Shared for educational reference. Rights in course materials may be held by UAL.
