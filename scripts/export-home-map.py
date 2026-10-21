"""
Build the homepage map's data from the adjacency landscape repository.

    ../petadex-adjacency-landscape/.venv/bin/python scripts/export-home-map.py \
        [path-to-petadex-adjacency-landscape]

Writes src/data/homeMap.json, the three stages of the map under the Logan
paragraph:

  1. pazy      every PAZy enzyme, with the few whose isolation site the source
               paper names placed on the map (PAZY_SITES below). The rest stay
               in an off-map cluster: PAZy records organisms, not places.
  2. petadex   the BioSamples behind the atlas families, gridded to GRID_DEG
               cells. Cells holding a PAZy enzyme's family are marked, so the
               expansion can start from them.
  3. sites     the five step-2a ecosystem callouts, read from annotations.json
               so their labels stay the landscape's.

Needs duckdb, which that repository's .venv has. Does not run during the
Gatsby build.
"""
import json
import os
import sys
from datetime import date
from pathlib import Path

import duckdb

ROOT = Path(__file__).resolve().parent.parent
SOURCE = Path(
    sys.argv[1]
    if len(sys.argv) > 1
    else os.path.expanduser("~/Documents/projects/petadex-adjacency-landscape")
)
DEST = ROOT / "src" / "data" / "homeMap.json"
GRID_DEG = 2.0

# Isolation sites named in the source papers. Only enzymes whose site the
# paper itself gives are here; `precision` says how close the point is.
PAZY_SITES = [
    {
        "label": "Sakai, Japan",
        "lat": 34.57,
        "lon": 135.48,
        "precision": "city",
        "habitat": "Sediment at a PET bottle recycling site",
        "enzymes": ["ISPETase"],
        "source": "10.1126/science.aad6359",
    },
    {
        "label": "Leipzig, Germany",
        "lat": 51.316,
        "lon": 12.395,
        "precision": "site",
        "habitat": "Compost at the Südfriedhof cemetery",
        "enzymes": ["PHL-1", "PHL-2", "PHL-3", "PHL-4", "PHL-5", "PHL-6", "PHL-7"],
        "source": "10.1002/cssc.202101062",
    },
    {
        "label": "Carnota, Galicia, Spain",
        "lat": 42.82,
        "lon": -9.09,
        "precision": "site",
        "habitat": "Intertidal sand after the Prestige oil spill",
        "enzymes": ["PE-H"],
        "source": "10.1016/j.syapm.2013.09.004",
    },
    {
        "label": "Guaymas Basin, Gulf of California",
        "lat": 27.0,
        "lon": -111.4,
        "precision": "site",
        "habitat": "Hydrothermal deep-sea sediment, ~2000 m down",
        "enzymes": ["GuaPA", "PET46"],
        "source": "10.1093/ismejo/wraf068",
    },
    {
        "label": "Buriram, Thailand",
        "lat": 14.99,
        "lon": 103.10,
        "precision": "province",
        "habitat": "Dry forest soil",
        "enzymes": ["Kubu-P"],
        "source": "10.1099/ijs.0.036533-0",
    },
    # Genome-mined enzymes: the paper names the organism, not a sample. These
    # sit where the species' type strain was isolated (its description / DSMZ).
    {
        "label": "Salar de Atacama, Chile",
        "lat": -23.5,
        "lon": -68.25,
        "precision": "type strain",
        "habitat": "Type strain from hyperarid desert soil",
        "enzymes": ["1573"],
        "source": "DSM 45479",
    },
    {
        "label": "Dokdo, Korea",
        "lat": 37.24,
        "lon": 131.87,
        "precision": "type strain",
        "habitat": "Type strain from seawater off the island",
        "enzymes": ["PET93"],
        "source": "10.1099/ijs.0.63777-0",
    },
    {
        "label": "Sonoran Desert, Arizona",
        "lat": 33.3,
        "lon": -112.4,
        "precision": "type strain",
        "habitat": "Type strain from desert soil",
        "enzymes": ["PET1"],
        "source": "DSM 21211",
    },
    {
        "label": "Taiwan",
        "lat": 23.9,
        "lon": 120.9,
        "precision": "type strain",
        "habitat": "Type strains from hot springs (Pingtung, Yangmingshan) and food-waste compost",
        "enzymes": ["CtPl", "ESM186", "Hfor_PE-H"],
        "source": "LMG 22827; DSM 24213; 10.1099/ijs.0.049452-0",
    },
    {
        "label": "Swartberg, South Africa",
        "lat": -33.35,
        "lon": 22.05,
        "precision": "type strain",
        "habitat": "Type strain from Gamka River bank soil",
        "enzymes": ["TEP097"],
        "source": "LMG 28849",
    },
    {
        "label": "Phatthalung, Thailand",
        "lat": 7.6,
        "lon": 100.1,
        "precision": "type strain",
        "habitat": "Type strain from mangrove forest soil",
        "enzymes": ["1628", "Mipa-P"],
        "source": "DSM 45245",
    },
    {
        "label": "Great Artesian Basin, Queensland",
        "lat": -24.0,
        "lon": 144.5,
        "precision": "type strain",
        "habitat": "Type strain from microbial mats in a hot bore runoff channel",
        "enzymes": ["TvgC"],
        "source": "DSM 21133",
    },
    {
        "label": "Guizhou, China",
        "lat": 26.8,
        "lon": 106.9,
        "precision": "type strain",
        "habitat": "Type strain from karst limestone",
        "enzymes": ["APET-5", "1169"],
        "source": "DSM 102208",
    },
]

# Sites the landscape places by BioProject rather than a lat/lon box. Their
# BioSamples carry no coordinates, so they sit on the country.
COUNTRY_POINTS = {"south africa": (-29.0, 24.7)}

# Where a tag is drawn instead of the site's own centre. Antarctica's centre is
# past the bottom of the paint, so its tag sat on the forest's edge; it is
# lifted into the open Southern Atlantic, toward the continent it names, and
# South Africa nudged up off the paint's bottom edge.
TAG_POINTS = {
    "Antarctica": (-27.0, -30.0),
    "South Africa": (-21.0, 24.7),
    # Clear of the pins over Siberia and Southeast Asia.
    "Lake Baikal": (62.0, 105.0),
    "Tropical peat swamp": (4.5, 106.0),
}

# Hover lines for the five step-2a sites (the landscape's callouts carry a
# photo and counts, not a sentence). South Africa's is cut from its `detail`.
SITE_NOTES = {
    "Arctic Canada": "Cold Arctic sediments and soils, near freezing for most of the year",
    "Antarctica": "Soils and lakes on the coldest, driest continent",
    "Yellowstone": "Hot spring sediments in the park's geothermal basins",
    "Alps": "High, cold mountain soils from across the European Alps",
    "South Africa": "Bioreactors treating gold-mine effluent, breaking down cyanide and thiocyanate",
}

# Landscape landmarks (steps 2b-2d) added so the ecosystems cover the planet,
# not just the Americas and Europe. Label and hover line are the landscape's
# own (`label`, `why`); the point is a well-known spot for its `place`. The
# photos (320×240 AVIF) are on the CDN under drylab-page/sites/.
LANDMARK_POINTS = {
    "Lake Chapala": (20.25, -103.0, "lake-chapala"),
    "Red Sea brine pool": (21.4, 38.1, "red-sea-brine-pool"),
    "Lake Baikal": (53.5, 108.0, "lake-baikal"),
    "Tropical peat swamp": (4.5, 114.5, "tropical-peat-swamp"),
    "Hot springs": (31.6, 130.55, "hot-springs"),  # Kagoshima, Japan, one of the four it lists
}


def main():
    data = SOURCE / "data"
    pazy_csv = str(data / "pazy_enzymes.csv")
    env = str(data / "family_env_samples.parquet")
    db = duckdb.connect()

    pazy = db.sql(
        f"""
        select enzyme_name, substrate, organism, metagenomic, family_id
        from read_csv_auto('{pazy_csv}')
        """
    ).fetchall()
    by_name = {}
    for name, substrate, organism, metagenomic, family_id in pazy:
        by_name.setdefault(name, []).append(
            {"family_id": None if family_id is None else int(family_id)}
        )

    pins = []
    placed = set()
    for site in PAZY_SITES:
        missing = [e for e in site["enzymes"] if e not in by_name]
        if missing:
            sys.exit(f"{site['label']}: not in pazy_enzymes.csv: {missing}")
        placed.update(site["enzymes"])
        families = sorted(
            {
                row["family_id"]
                for e in site["enzymes"]
                for row in by_name[e]
                if row["family_id"] is not None
            }
        )
        pins.append({**site, "families": families})

    substrates = {}
    for _, substrate, _, _, _ in pazy:
        for s in (substrate or "unknown").split(";"):
            s = s.strip() or "unknown"
            substrates[s] = substrates.get(s, 0) + 1

    pazy_families = sorted(
        {int(f) for *_, f in pazy if f is not None}
    )

    cells = db.sql(
        f"""
        with located as (
          select distinct biosample, family_id,
            floor(latitude / {GRID_DEG}) as gy,
            floor(longitude / {GRID_DEG}) as gx
          from '{env}'
          where latitude between -90 and 90 and longitude between -180 and 180
        )
        select gy, gx,
          count(distinct biosample) as samples,
          count(distinct family_id) as families,
          bool_or(family_id in ({",".join(map(str, pazy_families))})) as pazy
        from located
        group by 1, 2
        order by samples desc
        """
    ).fetchall()
    totals = db.sql(
        f"""
        select count(distinct biosample), count(distinct family_id)
        from '{env}' where latitude is not null
        """
    ).fetchone()

    annotations = json.loads((SOURCE / "annotations.json").read_text())
    summary = {
        row[0]: row
        for row in db.sql(
            f"select site, n_biosamples from read_csv_auto('{data / 'site_summary.csv'}')"
        ).fetchall()
    }
    sites = []
    for site in annotations["sites"]:
        if "lat" in site:
            lat = sum(site["lat"]) / 2
            lon = sum(site["lon"]) / 2
            box = {"lat": site["lat"], "lon": site["lon"]}
        else:
            lat, lon = COUNTRY_POINTS[site["country"]]
            box = None
        image = Path(site["image"]).with_suffix(".avif").name
        lat, lon = TAG_POINTS.get(site["label"], (lat, lon))
        sites.append(
            {
                "label": site["label"],
                "lat": round(lat, 2),
                "lon": round(lon, 2),
                "box": box,
                "habitat": site.get("habitat"),
                "image": f"https://static.igem.wiki/teams/6187/wiki/drylab-page/sites/{image}",
                "samples": int(summary[site["label"]][1])
                if site["label"] in summary
                else None,
            }
        )

    for site in sites:
        site["kind"] = "site"
        site["note"] = SITE_NOTES[site["label"]]
    landmarks = [
        l for group in annotations["landmarks"].values() for l in group
    ]
    for label, (lat, lon, image) in LANDMARK_POINTS.items():
        mark = next(l for l in landmarks if l["label"] == label)
        lat, lon = TAG_POINTS.get(label, (lat, lon))
        sites.append(
            {
                "label": label,
                "lat": lat,
                "lon": lon,
                "box": None,
                "habitat": None,
                "image": f"https://static.igem.wiki/teams/6187/wiki/drylab-page/sites/{image}.avif",
                "samples": None,
                "kind": "landmark",
                "note": mark["why"]
                if len(mark["why"]) < 120
                else mark["why"].split(". ")[0],
            }
        )

    out = {
        "exportedAt": date.today().isoformat(),
        "source": "petadex-adjacency-landscape/data",
        "pazy": {
            "total": len(pazy),
            "placed": len(placed),
            "substrates": dict(sorted(substrates.items(), key=lambda kv: -kv[1])),
            "pins": pins,
        },
        "petadex": {
            "gridDeg": GRID_DEG,
            "samples": int(totals[0]),
            "families": int(totals[1]),
            "cells": [
                {
                    "lat": round((gy + 0.5) * GRID_DEG, 2),
                    "lon": round((gx + 0.5) * GRID_DEG, 2),
                    "samples": int(samples),
                    "families": int(families),
                    "pazy": bool(pz),
                }
                for gy, gx, samples, families, pz in cells
            ],
        },
        "sites": {"caption": annotations.get("caption"), "items": sites},
    }
    DEST.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")) + "\n")
    print(
        f"Wrote {DEST.relative_to(ROOT)}: {len(pins)} PAZy pins "
        f"({len(placed)} of {len(pazy)} enzymes), {len(cells)} PETadex cells "
        f"({totals[0]} BioSamples), {len(sites)} sites"
    )


if __name__ == "__main__":
    main()
