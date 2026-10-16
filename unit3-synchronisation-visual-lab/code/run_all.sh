#!/usr/bin/env bash
# Run every Unit III demo that has a "real run" panel and save its output to
# ../real_outputs/<program>.txt, ready for build.py to inline into index.html.
# Usage (on Linux):  cd code && make && ./run_all.sh
set -u
cd "$(dirname "$0")"
OUT=../real_outputs
mkdir -p "$OUT"
run() {               # run <key> <command...>   (appends to OUT/key.txt)
  local key=$1; shift
  echo "\$ ./$*" >> "$OUT/$key.txt"
  timeout 40 "./$@" >> "$OUT/$key.txt" 2>&1
}
for k in ipc_bench mq_demo race_count prodcons_inout cli_demo sem_printers monitor_buffer bounded_buffer_sem readers_writers dining; do
  : > "$OUT/$k.txt"
done
run ipc_bench          ipc_bench
run mq_demo            mq_demo
run race_count         race_count
run prodcons_inout     prodcons_inout
run cli_demo           cli_demo
run sem_printers       sem_printers
run monitor_buffer     monitor_buffer
run bounded_buffer_sem bounded_buffer_sem
run bounded_buffer_sem bounded_buffer_sem wrong
run readers_writers    readers_writers
run dining             dining
run dining             dining ordered
echo "saved to $OUT:"; ls -1 "$OUT"
