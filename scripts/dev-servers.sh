#!/usr/bin/env bash
# Manage the local Gatsby dev servers across every iGEM_wiki checkout.
#
# A `gatsby develop` run holds a 6 GB heap plus ~11 worker processes, so two or
# three stray servers will exhaust memory and take the machine down with them.
# Workers are also easy to orphan: they outlive their parent and keep the RAM.
#
#   ./scripts/dev-servers.sh status   # what is running, and how much RAM it holds
#   ./scripts/dev-servers.sh stop     # stop every dev server and orphaned worker
#   ./scripts/dev-servers.sh start [port]   # start one, detached, default 8000
#
# Only ever touches node processes belonging to an iGEM_wiki* checkout. Editors,
# language servers and browsers are matched out explicitly and never signalled.
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Processes we must never signal, however they match.
PROTECTED='Cursor|Code Helper|tsserver|extension-host|Chrome|Electron|claude-code'

# PIDs of dev-server and worker processes in any iGEM_wiki* checkout.
server_pids() {
  pgrep -f 'iGEM_wiki' 2>/dev/null | while read -r pid; do
    cmd=$(ps -p "$pid" -o command= 2>/dev/null) || continue
    [[ -z "$cmd" ]] && continue
    echo "$cmd" | grep -qE "$PROTECTED" && continue
    echo "$cmd" | grep -qE 'gatsby|run-develop|gatsby-worker' || continue
    echo "$pid"
  done
}

human_rss() { # total RSS of the given pids, in GB
  local pids="$*"
  [[ -z "$pids" ]] && { echo "0.0"; return; }
  ps -o rss= -p "${pids// /,}" 2>/dev/null | awk '{s+=$1} END {printf "%.1f", s/1048576}'
}

cmd_status() {
  local pids; pids=$(server_pids | tr '\n' ' ')
  if [[ -z "${pids// /}" ]]; then
    echo "No dev servers running."
  else
    echo "Dev-server processes: $(echo "$pids" | wc -w | tr -d ' ')  holding $(human_rss "$pids") GB"
    for pid in $pids; do
      printf '  %-7s %s\n' "$pid" "$(ps -p "$pid" -o command= | cut -c1-90)"
    done
  fi
  echo
  echo "Listening ports:"
  lsof -nP -iTCP -sTCP:LISTEN 2>/dev/null | awk 'NR>1 && /node/ {print "  " $2, $9}' | sort -u
  echo "Memory free+inactive: $(vm_stat | awk '/Pages free/{f=$3} /Pages inactive/{i=$3} /Pages speculative/{s=$3} END{printf "%.1f GB", (f+i+s)*4096/1073741824}')"
}

cmd_stop() {
  local pids; pids=$(server_pids | tr '\n' ' ')
  if [[ -z "${pids// /}" ]]; then
    echo "Nothing to stop."
    return 0
  fi
  echo "Stopping $(echo "$pids" | wc -w | tr -d ' ') process(es), freeing $(human_rss "$pids") GB..."
  # SIGTERM first so Gatsby can clean up its cache lockfiles.
  kill $pids 2>/dev/null
  for _ in 1 2 3 4 5 6 7 8 9 10; do
    sleep 1
    [[ -z "$(server_pids | tr -d '\n')" ]] && break
  done
  local left; left=$(server_pids | tr '\n' ' ')
  if [[ -n "${left// /}" ]]; then
    echo "Still up after SIGTERM, forcing: $left"
    kill -9 $left 2>/dev/null
    sleep 1
  fi
  echo "Stopped. Remaining: $(server_pids | wc -l | tr -d ' ')"
}

cmd_start() {
  local port="${1:-8000}"
  # A port clash is fatal; another checkout's server is only worth a warning,
  # since worktrees under this repo legitimately run their own.
  if lsof -ti:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "Refusing to start: port $port is already in use by $(lsof -ti:"$port" -sTCP:LISTEN | head -1)."
    return 1
  fi
  local existing; existing=$(server_pids | tr '\n' ' ')
  if [[ -n "${existing// /}" ]]; then
    echo "Note: $(echo "$existing" | wc -w | tr -d ' ') dev process(es) already running, holding $(human_rss "$existing") GB."
  fi
  # `memory_pressure` is the number to trust: raw vm_stat free+inactive badly
  # undercounts, because macOS compresses and reclaims on demand.
  local free_pct; free_pct=$(memory_pressure 2>/dev/null | awk -F': ' '/free percentage/{gsub(/%/,"",$2); print $2}')
  local total_gb; total_gb=$(( $(sysctl -n hw.memsize) / 1073741824 ))
  if [[ -n "$free_pct" ]]; then
    echo "Memory: ${free_pct}% free of ${total_gb} GB (~$(awk -v p="$free_pct" -v t="$total_gb" 'BEGIN{printf "%.1f", p*t/100}') GB); a building server peaks near 5 GB"
    awk -v p="$free_pct" 'BEGIN{ exit (p+0 < 25) ? 0 : 1 }' && \
      echo "WARNING: under 25% free. Stop another server with '$(basename "$0") stop' before starting this one."
  fi
  local swap_used; swap_used=$(sysctl -n vm.swapusage | awk '{print $6}')
  echo "Swap in use: ${swap_used}"

  local log="$ROOT/.dev-server.log"
  : > "$log"
  # nohup in a subshell: survives this shell exiting, unlike a plain background job.
  ( cd "$ROOT" && nohup npm run develop -- -p "$port" > "$log" 2>&1 < /dev/null & )
  echo "Starting on port $port, logging to $log"
  echo "Bundling Mol* takes ~3 minutes on a cold cache."
}

case "${1:-status}" in
  status) cmd_status ;;
  stop)   cmd_stop ;;
  start)  shift; cmd_start "${1:-8000}" ;;
  *) echo "usage: $(basename "$0") {status|stop|start [port]}" >&2; exit 2 ;;
esac
