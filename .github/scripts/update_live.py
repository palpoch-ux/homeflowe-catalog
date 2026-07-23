import json
import os
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path


def child_text(node, name):
    child = node.find(name)
    return (child.text or "").strip() if child is not None else ""


def stock_value(offer):
    raw = child_text(offer, "count")
    if raw:
        try:
            return max(0, int(float(raw.replace(",", "."))))
        except ValueError:
            pass
    return 1 if offer.get("available", "").lower() == "true" else 0


feed_url = os.environ["HOMEFLOWE_FEED_URL"].strip()
token = os.environ.get("HOMEFLOWE_FEED_TOKEN", "").strip()
headers = {"User-Agent": "HomeFlowe-Catalog-Updater/1.0"}
if token:
    headers["Authorization"] = f"Bearer {token}"

request = urllib.request.Request(feed_url, headers=headers)
with urllib.request.urlopen(request, timeout=180) as response:
    root = ET.fromstring(response.read())

products = {}
for offer in root.findall(".//offer"):
    product_id = str(offer.get("id", "")).strip()
    if not product_id:
        continue
    try:
        price = round(float(child_text(offer, "price").replace(",", ".")))
    except ValueError:
        continue
    if price <= 0:
        continue
    products[product_id] = [price, stock_value(offer)]

payload = {"updated": root.get("date", ""), "products": products}
output = Path("catalog-live.js")
output.write_text(
    "window.CATALOG_LIVE="
    + json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    + ";",
    encoding="utf-8",
)
print(f"Updated prices and stock for {len(products)} products")
