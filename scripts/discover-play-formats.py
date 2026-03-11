#!/usr/bin/env python3
"""
Discover all playText format variants per playType from play-by-play CSVs.
Samples across multiple seasons to catch format changes over time.
"""
import csv
import os
import sys
from collections import defaultdict

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'starter_pack', 'data', 'plays')
SAMPLE_YEARS = [2014, 2017, 2020, 2023, 2024]
SAMPLES_PER_TYPE = 25


def discover_formats():
    samples = defaultdict(list)
    type_counts = defaultdict(int)

    for year in SAMPLE_YEARS:
        year_dir = os.path.join(DATA_DIR, str(year))
        if not os.path.isdir(year_dir):
            print(f"Warning: {year_dir} not found, skipping")
            continue

        csv_files = sorted([f for f in os.listdir(year_dir) if f.endswith('.csv')])
        # Sample from first and last week files
        for csv_file in [csv_files[0], csv_files[-1]]:
            filepath = os.path.join(year_dir, csv_file)
            with open(filepath, encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    play_type = row.get('playType', '')
                    play_text = row.get('playText', '')
                    if not play_type or not play_text:
                        continue
                    type_counts[play_type] += 1
                    if len(samples[play_type]) < SAMPLES_PER_TYPE:
                        samples[play_type].append({
                            'year': year,
                            'text': play_text,
                            'yardsGained': row.get('yardsGained', ''),
                            'scoring': row.get('scoring', ''),
                            'offense': row.get('offense', ''),
                        })

    # Output results
    print("=" * 80)
    print("PLAY-BY-PLAY FORMAT DISCOVERY REPORT")
    print("=" * 80)

    for play_type in sorted(type_counts.keys(), key=lambda k: -type_counts[k]):
        count = type_counts[play_type]
        print(f"\n{'-' * 60}")
        print(f"playType: {play_type}  (sampled count: {count})")
        print(f"{'-' * 60}")
        for s in samples[play_type]:
            print(f"  [{s['year']}] yards={s['yardsGained']} scoring={s['scoring']}")
            print(f"         {s['text'][:120]}")
        print()


if __name__ == '__main__':
    discover_formats()
