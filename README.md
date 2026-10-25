# rahul-m-salagundi · portfolio

My personal portfolio site. It's built with plain HTML, CSS and JavaScript (no build step, no dependencies) and styled like an observability console and CI pipeline.

## Sections

| Section | Theme |
| --- | --- |
| Hero | Animated service-mesh topology canvas, typed `kubectl` terminal, KPI stat panels with sparklines |
| Overview | `kubectl describe`-style profile |
| Metrics | Grafana-style panels with real résumé numbers (build time, AWS spend, SSO adoption) |
| Pipeline | Career as a CI workflow. Click a job to stream its log |
| Deployments | InstaDeploy with an animated architecture diagram, plus internal work |
| Stack | Skills as `kubectl get pods`, filterable by namespace |
| Certs | AWS SAA shown as an x509 certificate viewer, linked to Credly |
| On-call | Contact as an incident page plus a JSON response |

Extras: a boot sequence (once per session), a `⌘K` / `Ctrl+K` / `/` command palette, a live `tail -f` log of your own session, a themed 404, and full `prefers-reduced-motion` support.

## Run locally

```bash
python3 -m http.server 8080
# open http://localhost:8080
```

## Deploy to GitHub Pages

```bash
git init && git add . && git commit -m "Initial portfolio"
git branch -M main
git remote add origin https://github.com/codeinja/codeinja.github.io.git
git push -u origin main
```

Then go to **Settings → Pages → Build and deployment**, set **Source: Deploy from a branch**, and pick **Branch: `main` / root**.
The site goes live at `https://codeinja.github.io`.

## Editing content

- Text lives in `index.html`. Each section is commented (`<!-- 03 PIPELINE -->` and so on).
- Skills live in the `NS` object in `js/main.js`.
- The hero terminal script is `TERM_SCRIPT` in `js/main.js`.
- Colors and fonts are CSS variables at the top of `css/style.css`.
- The résumé and certificate PDFs are in `assets/docs/`.
