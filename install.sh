#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
PORT="${1:-8765}"
echo "rhuanssauro-sun-interference-calculator"
echo "http://127.0.0.1:${PORT}/"
if command -v python3 >/dev/null 2>&1; then
  exec python3 ./serve.py --port "$PORT"
fi
if command -v python >/dev/null 2>&1; then
  exec python ./serve.py --port "$PORT"
fi
echo "Python 3 is required. Install python3 and re-run." >&2
exit 1
