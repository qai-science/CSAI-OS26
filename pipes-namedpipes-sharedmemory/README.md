# 3.3 Shared Memory, Pipes and Named Pipes in Linux

**Interactive simulation:** [open the step-by-step simulator](https://qai-science.github.io/CSAI-OS26/pipes-namedpipes-sharedmemory/simulation/) (source: [`simulation/index.html`](simulation/index.html), a single file that also works offline). It has 7 tabs: shared memory, the race without synchronisation, unnamed pipe, named pipe, shell FIFO, semaphore fixing the race, and counting semaphore. There is also a semaphore theory section with a wait/post playground.

| File | Shows |
|---|---|
| `shm_writer.c` | POSIX shared memory: `shm_open` → `ftruncate` → `mmap` → write `"hello"` → `shm_unlink` |
| `shm_reader.c` | A second process opens the same name `/frames` and sees the same bytes |
| `pipe_demo.c` | Unnamed pipe between a parent (writer) and its `fork()`ed child (reader) |
| `fifo_writer.c` / `fifo_reader.c` | Named pipe `/tmp/myfifo` between two unrelated processes |
| `sem_writer.c` / `sem_reader.c` | Shared memory guarded by a named semaphore `/ready` (starts at 0): the reader waits until the writer posts |
| `sem_counting.c` | Counting semaphore `/slots` = 2: four processes, never more than two inside |

## Build

```bash
cd pipes-namedpipes-sharedmemory
make
```

## 1. Shared memory (two terminals)

Terminal 1:
```bash
./shm_writer
```
Terminal 2:
```bash
./shm_reader
ls -l /dev/shm
```
The reader prints `read "hello" from /frames`, and `/dev/shm/frames` is a 4096-byte object. Press Enter in terminal 1; the writer calls `shm_unlink` and the name disappears. The kernel provides **no synchronisation**: if the reader runs before the writer has written, it simply sees whatever bytes are there.

## 2. Unnamed pipe (one terminal)

```bash
./pipe_demo
```
The parent and child lines may print in either order; that depends on the scheduler.

## 3. Named pipe (two terminals)

Terminal 1 (blocks until a reader opens the FIFO):
```bash
./fifo_writer
```
Terminal 2:
```bash
ls -l /tmp/myfifo
./fifo_reader
```
`ls` shows type `p` (pipe). The reader prints `got "hello through the FIFO"`.

## 4. FIFO from the shell only

```bash
mkfifo /tmp/f
cat /tmp/f            # terminal 1, blocks
echo hi > /tmp/f      # terminal 2
```

## 5. Semaphore fixes the race (two terminals)

Start the **reader first**. It now waits instead of reading empty memory:
```bash
./sem_reader
```
Terminal 2, while the reader waits:
```bash
ls -l /dev/shm
./sem_writer
```
`/dev/shm` shows `frames` (4096 bytes) and `sem.ready` (32 bytes). The writer sleeps 3 s, writes `hello` and calls `sem_post`. Only then does the reader print `read "hello" from /frames`.

## 6. Counting semaphore (one terminal)

```bash
./sem_counting
```
Real run on the VM (seconds on the left):
```
51.00  P1: waiting for a slot
51.04  P1: got a slot, working
51.13  P2: waiting for a slot
51.20  P2: got a slot, working
51.25  P3: waiting for a slot
51.31  P4: waiting for a slot
53.01  P1: done, releasing
53.07  P3: got a slot, working
53.10  P2: done, releasing
53.13  P4: got a slot, working
55.13  P3: done, releasing
55.28  P4: done, releasing
```
P3 and P4 sleep until P1 and P2 post. At every moment, value + processes inside = 2.

## Sample output (Ubuntu, Linux 7.0)

```
-rw-rw-r-- 1 cosmos cosmos 4096 Oct 15 02:56 frames
reader: read "hello" from /frames
writer: /frames unlinked

child  (pid 53192): got "hello through the pipe"
parent (pid 53190): sent "hello through the pipe"

prw-rw-r-- 1 cosmos cosmos 0 Oct 15 02:56 /tmp/myfifo
reader: got "hello through the FIFO"
writer: sent "hello through the FIFO"
```
