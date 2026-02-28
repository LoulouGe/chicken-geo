#!/usr/bin/env python3
"""Read the 3 PZ JSON sources and produce a compact countries.json."""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

SOURCES = {
    "fr": ROOT / "PZ_geo_location_guesser_fra_FR_x.x.x.json",
    "en": ROOT / "PZ_geo_location_guesser_eng_US_x.x.x.json",
    "es": ROOT / "PZ_geo_location_guesser_spa_ES_x.x.x.json",
}

# Map unreal_ids[0] → GeoJSON feature.properties.name
# Only entries that differ from the unreal_id itself need to be listed.
UNREAL_TO_GEO = {
    "BosniaAndHerzegovina": "Bosnia and Herzegovina",
    "BurkinaFaso": "Burkina Faso",
    "CentralAfricanRepublic": "Central African Republic",
    "CoteDIvoire": "Ivory Coast",
    "CostaRica": "Costa Rica",
    "CzechRepublic": "Czech Republic",
    "DemocraticRepublicOfCongo": "Democratic Republic of the Congo",
    "DominicanRepublic": "Dominican Republic",
    "ElSalvador": "El Salvador",
    "Eswatini": "Swaziland",
    "GuineaBissau": "Guinea Bissau",
    "NewZealand": "New Zealand",
    "NorthKorea": "North Korea",
    "NorthMacedonia": "Macedonia",
    "PapuaNewGuinea": "Papua New Guinea",
    "RepublicOfCongo": "Republic of the Congo",
    "SaudiArabia": "Saudi Arabia",
    "Serbia": "Republic of Serbia",
    "SierraLeone": "Sierra Leone",
    "SouthAfrica": "South Africa",
    "SouthKorea": "South Korea",
    "SouthSudan": "South Sudan",
    "SriLanka": "Sri Lanka",
    "Tanzania": "United Republic of Tanzania",
    "UnitedArabEmirates": "United Arab Emirates",
    "UnitedStates": "USA",
    "WesternSahara": "Western Sahara",
}

# Countries present in the GeoJSON but absent from the PZ data.
# We add them manually so players can still land on them.
FALLBACK_COUNTRIES = [
    {
        "geoId": "Djibouti",
        "fr": {"name": "Djibouti", "capital": "Djibouti"},
        "en": {"name": "Djibouti", "capital": "Djibouti"},
        "es": {"name": "Yibuti", "capital": "Yibuti"},
        "flag": "🇩🇯",
    },
    {
        "geoId": "Eritrea",
        "fr": {"name": "Erythr\u00e9e", "capital": "Asmara"},
        "en": {"name": "Eritrea", "capital": "Asmara"},
        "es": {"name": "Eritrea", "capital": "Asmara"},
        "flag": "🇪🇷",
    },
    {
        "geoId": "Qatar",
        "fr": {"name": "Qatar", "capital": "Doha"},
        "en": {"name": "Qatar", "capital": "Doha"},
        "es": {"name": "Catar", "capital": "Doha"},
        "flag": "🇶🇦",
    },
    {
        "geoId": "Equatorial Guinea",
        "fr": {"name": "Guin\u00e9e \u00e9quatoriale", "capital": "Malabo"},
        "en": {"name": "Equatorial Guinea", "capital": "Malabo"},
        "es": {"name": "Guinea Ecuatorial", "capital": "Malabo"},
        "flag": "🇬🇶",
    },
    {
        "geoId": "Gambia",
        "fr": {"name": "Gambie", "capital": "Banjul"},
        "en": {"name": "Gambia", "capital": "Banjul"},
        "es": {"name": "Gambia", "capital": "Banjul"},
        "flag": "🇬🇲",
    },
    {
        "geoId": "Jamaica",
        "fr": {"name": "Jama\u00efque", "capital": "Kingston"},
        "en": {"name": "Jamaica", "capital": "Kingston"},
        "es": {"name": "Jamaica", "capital": "Kingston"},
        "flag": "🇯🇲",
    },
    {
        "geoId": "The Bahamas",
        "fr": {"name": "Bahamas", "capital": "Nassau"},
        "en": {"name": "Bahamas", "capital": "Nassau"},
        "es": {"name": "Bahamas", "capital": "Nas\u00e1u"},
        "flag": "🇧🇸",
    },
    {
        "geoId": "Trinidad and Tobago",
        "fr": {"name": "Trinit\u00e9-et-Tobago", "capital": "Port-d'Espagne"},
        "en": {"name": "Trinidad and Tobago", "capital": "Port of Spain"},
        "es": {"name": "Trinidad y Tobago", "capital": "Puerto Espa\u00f1a"},
        "flag": "🇹🇹",
    },
    {
        "geoId": "Kosovo",
        "fr": {"name": "Kosovo", "capital": "Pristina"},
        "en": {"name": "Kosovo", "capital": "Pristina"},
        "es": {"name": "Kosovo", "capital": "Pristina"},
        "flag": "🇽🇰",
    },
    {
        "geoId": "Brunei",
        "fr": {"name": "Brunei", "capital": "Bandar Seri Begawan"},
        "en": {"name": "Brunei", "capital": "Bandar Seri Begawan"},
        "es": {"name": "Brun\u00e9i", "capital": "Bandar Seri Begawan"},
        "flag": "🇧🇳",
    },
    {
        "geoId": "East Timor",
        "fr": {"name": "Timor oriental", "capital": "Dili"},
        "en": {"name": "East Timor", "capital": "Dili"},
        "es": {"name": "Timor Oriental", "capital": "Dili"},
        "flag": "🇹🇱",
    },
    {
        "geoId": "Fiji",
        "fr": {"name": "Fidji", "capital": "Suva"},
        "en": {"name": "Fiji", "capital": "Suva"},
        "es": {"name": "Fiyi", "capital": "Suva"},
        "flag": "🇫🇯",
    },
    {
        "geoId": "Solomon Islands",
        "fr": {"name": "\u00celes Salomon", "capital": "Honiara"},
        "en": {"name": "Solomon Islands", "capital": "Honiara"},
        "es": {"name": "Islas Salom\u00f3n", "capital": "Honiara"},
        "flag": "🇸🇧",
    },
    {
        "geoId": "Vanuatu",
        "fr": {"name": "Vanuatu", "capital": "Port-Vila"},
        "en": {"name": "Vanuatu", "capital": "Port Vila"},
        "es": {"name": "Vanuatu", "capital": "Port Vila"},
        "flag": "🇻🇺",
    },
]

# unreal_ids to skip (not real standalone countries in the GeoJSON)
SKIP_UNREAL = {"Scotland", "Wales", "Greenland"}


def load_source(lang: str) -> dict[str, dict]:
    """Return {entry_uid: entry} for countries only."""
    path = SOURCES[lang]
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    factories = data["exercise_factories"]
    return {
        uid: entry
        for uid, entry in factories.items()
        if entry.get("entry_type") == "country"
    }


def build() -> list[dict]:
    fr_data = load_source("fr")
    en_data = load_source("en")
    es_data = load_source("es")

    results = []
    seen_geo = set()

    for uid, fr_entry in fr_data.items():
        unreal_id = fr_entry.get("unreal_ids", [None])[0]
        if not unreal_id or unreal_id in SKIP_UNREAL:
            continue

        geo_id = UNREAL_TO_GEO.get(unreal_id, unreal_id)
        if geo_id in seen_geo:
            continue
        seen_geo.add(geo_id)

        en_entry = en_data.get(uid, {})
        es_entry = es_data.get(uid, {})

        results.append(
            {
                "geoId": geo_id,
                "fr": {
                    "name": fr_entry.get("entry_name", ""),
                    "capital": fr_entry.get("capital", ""),
                },
                "en": {
                    "name": en_entry.get("entry_name", ""),
                    "capital": en_entry.get("capital", ""),
                },
                "es": {
                    "name": es_entry.get("entry_name", ""),
                    "capital": es_entry.get("capital", ""),
                },
                "flag": fr_entry.get("flag_emoji", ""),
            }
        )

    # Add fallback countries not present in PZ data
    for fb in FALLBACK_COUNTRIES:
        if fb["geoId"] not in seen_geo:
            results.append(fb)
            seen_geo.add(fb["geoId"])

    results.sort(key=lambda c: c["geoId"])
    return results


def main():
    countries = build()
    out = ROOT / "countries.json"
    with open(out, "w", encoding="utf-8") as f:
        json.dump(countries, f, ensure_ascii=False, indent=1)
    print(f"Wrote {len(countries)} countries to {out}")


if __name__ == "__main__":
    main()
