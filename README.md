# Grahapravesham Site

Static GitHub Pages site for the Grahapravesham invitation, venue details, RSVP, and livestream.

## Edit content

- Update all event content in [src/data/site.json](/Users/chellamma/Documents/Grahapravesham/src/data/site.json).
- Replace placeholder images by updating the `media` paths in that same JSON file.

## Local preview

Run a static server from the repo root. Example:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## GitHub Pages deployment

- Create an empty GitHub repository under `NithyasriBabu`.
- Add that repo as the `origin` remote for this local repo.
- Push the `main` branch.
- In GitHub repo settings, ensure Pages is configured to use `GitHub Actions`.
- The workflow in [.github/workflows/deploy.yml](/Users/chellamma/Documents/Grahapravesham/.github/workflows/deploy.yml) will publish the site automatically on each push to `main`.

## Files

- [index.html](/Users/chellamma/Documents/Grahapravesham/index.html)
- [styles.css](/Users/chellamma/Documents/Grahapravesham/styles.css)
- [script.js](/Users/chellamma/Documents/Grahapravesham/script.js)
- [src/data/site.json](/Users/chellamma/Documents/Grahapravesham/src/data/site.json)
