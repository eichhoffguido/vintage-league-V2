#!/usr/bin/env python3
"""Scraper for findyourjersey.org vintage football shirt sales data.

Collects sold jersey listings into the jersey_price_references table.
Respects rate limits: max 1 request/second.
Idempotent: skips already-scraped URLs (checked via source_url unique constraint).
"""

import os
import re
import sys
import time
from datetime import date, datetime

import requests
from bs4 import BeautifulSoup
from supabase import create_client, Client

BASE_URL = "https://www.findyourjersey.org"
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
REQUEST_DELAY = 1.0


def get_supabase() -> Client:
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        sys.exit("FATAL: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


def parse_sale_card(card) -> dict | None:
    try:
        title_el = card.select_one("h2 a")
        if not title_el:
            return None
        title = title_el.get_text(strip=True)
        href = title_el.get("href", "")
        source_url = BASE_URL + href if href.startswith("/") else href

        team = title.strip()
        season = None
        year = None

        season_match = re.search(r"(\d{4})[/-](\d{2,4})", title)
        if season_match:
            season = season_match.group(0)
            year = int(season_match.group(1))
        else:
            year_match = re.search(r"\b(19\d{2}|20\d{2})\b", title)
            if year_match:
                year = int(year_match.group(1))

        price_el = card.select_one(".price, .sale-price, [class*=price]")
        sale_price_cents = None
        if price_el:
            price_text = price_el.get_text(strip=True)
            price_match = re.search(r"€?\s*(\d+(?:[.,]\d+)?)", price_text)
            if price_match:
                raw = price_match.group(1).replace(",", ".")
                sale_price_cents = int(round(float(raw) * 100))

        condition = None
        size = None
        meta_els = card.select("p, .meta, [class*=meta], span")
        for el in meta_els:
            text = el.get_text(strip=True).lower()
            if not condition:
                for c in ["excellent", "very good", "good", "fair", "poor", "used", "new"]:
                    if c in text:
                        condition = c.title()
                        break
            if not size:
                for s in ["xs", "s", "m", "l", "xl", "xxl", "xxxl", "38", "40", "42", "44", "46", "48"]:
                    if re.search(rf"\b{s}\b", text):
                        size = s.upper()
                        break

        sale_date = None
        date_el = card.select_one("time, .date, [class*=date]")
        if date_el:
            date_text = date_el.get("datetime") or date_el.get_text(strip=True)
            if date_text:
                try:
                    sale_date = str(date.fromisoformat(date_text))
                except (ValueError, TypeError):
                    pass

        if sale_price_cents is None:
            print(f"  SKIP: no price found for {team}")
            return None

        return {
            "team": team,
            "season": season,
            "year": year,
            "condition": condition,
            "size": size,
            "sale_price_cents": sale_price_cents,
            "currency": "EUR",
            "sale_date": sale_date,
            "source_url": source_url,
        }
    except Exception as e:
        print(f"  ERROR parsing card: {e}")
        return None


def scrape_page(url: str, supabase: Client) -> int:
    print(f"\nFetching {url} ...")
    try:
        resp = requests.get(url, timeout=30)
        resp.raise_for_status()
    except requests.RequestException as e:
        print(f"  REQUEST FAILED: {e}")
        return 0

    soup = BeautifulSoup(resp.text, "html.parser")
    cards = soup.select("article, .product, .listing, [class*=sale], li.sale")
    print(f"  Found {len(cards)} card(s)")

    new_count = 0
    for card in cards:
        record = parse_sale_card(card)
        if not record:
            continue

        existing = supabase.table("jersey_price_references") \
            .select("id") \
            .eq("source_url", record["source_url"]) \
            .execute()

        if existing.data:
            print(f"  EXISTS: {record['team']} ({record['source_url']})")
            continue

        record["scraped_at"] = datetime.utcnow().isoformat()
        result = supabase.table("jersey_price_references").insert(record).execute()
        if result.data:
            new_count += 1
            price_euro = record["sale_price_cents"] / 100
            print(f"  INSERTED: {record['team']} - €{price_euro:.2f}")
        else:
            print(f"  FAILED: {record['team']}")

        time.sleep(REQUEST_DELAY)

    return new_count


def main():
    print(f"=== findyourjersey.org scraper ===")
    print(f"Start time: {datetime.now().isoformat()}")
    supabase = get_supabase()

    total_new = 0
    page = 1
    while True:
        if page == 1:
            url = BASE_URL
        else:
            url = f"{BASE_URL}/page/{page}/"

        count = scrape_page(url, supabase)
        total_new += count

        resp = requests.get(url, timeout=30)
        soup = BeautifulSoup(resp.text, "html.parser")
        next_btn = soup.select_one("a.next, .pagination .next a, a:has-text('Next')")
        if not next_btn:
            break
        page += 1
        time.sleep(REQUEST_DELAY)

    print(f"\n=== Done. Inserted {total_new} new records ===")


if __name__ == "__main__":
    main()
