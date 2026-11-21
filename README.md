# Leonida Ledger

[![make.fun](https://img.shields.io/badge/make.fun-gta6--trophy--guide--01-orange)](https://make.fun/bounty/gta6-trophy-guide-01)
[![owner](https://img.shields.io/badge/owner-najih422-blue)](https://github.com/najih422/gta6-trophy-guide-01-entry)

An offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI: official names, descriptions and grades, a guide in its own words for every trophy with its sources named, a five-stage roadmap to the platinum, missable flags, a spoiler setting, and a checklist that saves progress in the browser and exports/imports it.

Serve `app/` with any static server and open `index.html` — it works with the network off.

```sh
node serve.ts
# open http://localhost:8080
```

To build the submission bundle: `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts` — it writes `out/app`, `out/screenshots` and `out/dossier.json`.
