# 3.3 Shared Memory, Pipes and Named Pipes in Linux

| File | Shows |
|---|---|
| `shm_writer.c` | POSIX shared memory: `shm_open` → `ftruncate` → `mmap` → write `"hello"` → `shm_unlink` |
| `shm_reader.c` | A second process opens the same name `/frames` and sees the same bytes |
| `pipe_demo.c` | Unnamed pipe between a parent (writer) and its `fork()`ed child (reader) |
| `fifo_writer.c` / `fifo_reader.c` | Named pipe `/tmp/myfifo` between two unrelated processes |

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
