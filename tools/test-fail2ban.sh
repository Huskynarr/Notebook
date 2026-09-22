#!/usr/bin/env bash
set -euo pipefail

if ! command -v fail2ban-regex >/dev/null 2>&1; then
  echo 'fail2ban-regex is required (Debian/Ubuntu: apt-get install fail2ban).' >&2
  exit 1
fi

repo_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
fixture="$repo_root/deploy/fail2ban/test.log"
filter="$repo_root/deploy/fail2ban/filter.d/notebook-auth.conf"
actual="$(LC_ALL=C fail2ban-regex --usedns=no --out=ip "$fixture" "$filter")"
expected='198.51.100.10
2001:db8::20
203.0.113.30
2001:db8::40
198.51.100.50'
if [[ "$actual" != "$expected" ]]; then
  printf 'Unexpected extracted hosts:\n%s\n' "$actual" >&2
  exit 1
fi

report="$(LC_ALL=C fail2ban-regex --usedns=no --print-no-missed --print-no-ignored "$fixture" "$filter")"
rows="$(TZ=Europe/Berlin LC_ALL=C fail2ban-regex --usedns=no --out=row "$fixture" "$filter")"
printf '%s\n' "$report"
python3 - "$report" "$rows" "$fixture" <<'PY'
import ast
from datetime import datetime
import json
import re
import sys

report = sys.argv[1]
assert re.search(r'Lines: 12 lines, 0 ignored, 5 matched, 7 missed', report), report
dates = report.split('Date template hits:', 1)[1].split('Lines:', 1)[0]
assert re.search(r'\[\s*12\]', dates), 'All fixture timestamps must be recognized: ' + dates
rows = ast.literal_eval('[' + sys.argv[2] + ']')
with open(sys.argv[3], encoding='utf-8') as source:
    events = [json.loads(line) for line in source][:5]
expected_times = [int(datetime.fromisoformat(event['time'].replace('Z', '+00:00')).timestamp()) for event in events]
assert [row[1] for row in rows] == expected_times, 'UTC must remain UTC on a Europe/Berlin host'
print('Fail2ban regression: 5 exact IP matches, 7 negatives, 12 parsed timestamps, UTC preserved.')
PY
