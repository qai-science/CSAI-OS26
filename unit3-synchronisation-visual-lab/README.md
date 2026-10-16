# CSEG2060 Operating Systems · Unit III Visual Lab

Every topic of Unit III (3.1 to 3.16) as a step-by-step visual simulation, plus the real Linux C programs behind them and worked numericals.

**Open it online:** https://qai-science.github.io/CSAI-OS26/unit3-synchronisation-visual-lab/ , or open `index.html` from this folder in any browser. It is one self-contained file and works offline. Pick a topic in the sidebar.

## What each tab gives you

- **The process, step by step:** a numbered list of the stages of the concept. The current stage is highlighted as the animation plays, and clicking a stage jumps the animation there.
- **The animation:** processes, shared memory, queues, semaphores and monitors, redrawn at every step.
- **This step, explained:** a plain-language description of the exact step just executed, tagged with its stage number.
- **Live narration:** every step so far, newest first.
- **Code:** the slide's code, with a coloured tag on the next line of each process and the executed line marked.
- **You are the scheduler** (for concurrent topics): pick which process runs next and try to break the algorithm.
- **Real run:** output of the matching C program on an Ubuntu VM.
- **Requirements check** and an **in-depth** section.

## Topics

| Session | Topic | Tab |
|---|---|---|
| 1 | 3.1 Inter Process Communication | separate address spaces, the kernel carries the data |
| 1 | 3.2 Shared memory vs message passing | system-call and copy counters, across machines |
| 1 | 3.2 Message-passing design | mailbox with capacity 0 / n / unbounded, blocking, rendezvous |
| 2 | 3.3 POSIX shared memory · ordinary pipes · named pipes | `shm_open`/`mmap`, `pipe`/`fork`, `mkfifo` |
| 3 | 3.4 Critical section problem | entry / critical / exit / remainder with 3 ATMs |
| 3 | 3.5 Race condition | the slide's count = 5 table, t0 to t5 |
| 3 | 3.6 Producer–consumer | 8-slot circular buffer that holds only 7 |
| 4 | 3.7 Disabling interrupts · TestAndSet · Swap | 1 CPU vs 2 CPUs; atomic instructions |
| 4 | 3.8 Software solutions | spinning vs sleeping on one CPU |
| 5 | 3.9 Counting semaphore | 3 printers, 5 jobs, negative value = waiters |
| 5 | 3.10 Binary semaphore | mutex = 1 (one key) and synch = 0 (ordering) |
| 6 | 3.11 Monitors · condition variables | bank account; BoundedBuffer with notFull/notEmpty |
| 7 | 3.12–3.15 Algorithm 1, 2, Peterson, Bakery | the slide examples, incl. P1:3, P2:4, P4:4 |
| 8 | 3.16 Bounded buffer · readers–writers · dining philosophers | wrong semaphore order deadlock, writer starvation, deadlock and fix |
| — | Numerical exercises and step-by-step solutions | 11 questions, 3 in the mid-semester pattern |

## Real programs (`code/`)

```bash
cd code
make            # builds every program
./run_all.sh    # runs the demos and saves outputs to ../real_outputs/
cd .. && python3 build.py   # rebuilds index.html with those outputs inlined
```

| Program | Topic |
|---|---|
| `ipc_bench`, `mq_demo` | 3.2 shared memory vs pipe (100 MB); POSIX message queue with capacity 2 |
| `shm_writer`/`shm_reader`, `pipe_demo`, `fifo_writer`/`fifo_reader` | 3.3 |
| `race_count`, `prodcons_inout` | 3.5, 3.6 |
| `cli_demo`, `cs_tas`, `cs_swap`, `cs_race`, `cs_peterson`, `cs_mutex` | 3.7, critical section |
| `sem_printers`, `cs_binsem`, `sem_order`, `sem_writer`/`sem_reader`, `sem_counting` | 3.9, 3.10 |
| `monitor_bank`, `monitor_buffer` | 3.11 |
| `alg1_turn`, `alg2_flag`, `bakery` | 3.12–3.15 |
| `bounded_buffer_sem`, `readers_writers`, `dining` | 3.16 |

## Source layout

`src/` holds the page shell, styles, engine and one file per session; `build.py` inlines them into `index.html`. Edit `src/`, then run `python3 build.py`.
