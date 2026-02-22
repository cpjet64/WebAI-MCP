#!/usr/bin/env python3
"""Enforce advisory baseline policy — fail CI if any exception has expired."""

import sys
import tomllib
from datetime import date, datetime
from pathlib import Path


def main() -> int:
    baseline_path = Path(__file__).resolve().parent.parent / "security" / "advisory-baseline.toml"

    if not baseline_path.exists():
        print("advisory-baseline.toml not found — no exceptions to enforce")
        return 0

    with open(baseline_path, "rb") as f:
        data = tomllib.load(f)

    advisories = data.get("advisory", [])
    if not advisories:
        print("No advisory exceptions — baseline is clean")
        return 0

    today = date.today()
    expired = []
    active = []

    for adv in advisories:
        adv_id = adv.get("id", "UNKNOWN")
        expires_str = adv.get("expires", "")
        reason = adv.get("reason", "no reason given")

        if not expires_str:
            expired.append(f"  {adv_id}: missing expiry date")
            continue

        try:
            expires = datetime.strptime(expires_str, "%Y-%m-%d").date()
        except ValueError:
            expired.append(f"  {adv_id}: invalid date format '{expires_str}'")
            continue

        if expires < today:
            expired.append(f"  {adv_id}: expired {expires_str} — {reason}")
        else:
            active.append(f"  {adv_id}: expires {expires_str} — {reason}")

    if active:
        print(f"Active exceptions ({len(active)}):")
        for a in active:
            print(a)

    if expired:
        print(f"\nEXPIRED exceptions ({len(expired)}) — these MUST be resolved:")
        for e in expired:
            print(e)
        return 1

    print("All advisory exceptions are within their expiry window")
    return 0


if __name__ == "__main__":
    sys.exit(main())
