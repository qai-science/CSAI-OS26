# 3.11–3.15 Monitors, Algorithms 1, 2 and 3 (Peterson), and the Bakery algorithm

**Interactive simulation:** [open the simulator](https://qai-science.github.io/CSAI-OS26/monitors-and-algorithms/simulation/) (source: [`simulation/index.html`](simulation/index.html), a single file that also works offline).

| Tab | What students see |
|---|---|
| 1 Monitor: bank account | The monitor drawn as on the slide: entry queue, shared data, `deposit()`/`withdraw()`, the condition queue `funds`, and initialisation. Three ATMs, with `wait` releasing the monitor and Mesa `signal` |
| 2 Algorithm 1: turn | Strict alternation: mutual exclusion holds, but **progress fails** |
| 3 Algorithm 2: flags | Mutual exclusion holds, but both flags up means **deadlock** |
| 4 Algorithm 3: Peterson | Flags plus turn: mutual exclusion, progress and bounded waiting |
| 5 Bakery (n = 4) | Tickets, a tie broken by process id, `choosing[]`, and first-come-first-served order |
| 6 Check yourself | The five Session 7 questions, with answers |

Every tab has a guided tour with live narration, plus a **You are the scheduler** mode: you pick which thread runs next and try to break the algorithm yourself. Threads move between Remainder → Entry → Critical section → Exit, and each one shows what it is "thinking".

## Real programs

| File | Shows |
|---|---|
| `monitor_bank.c` | A monitor in C = shared data + `pthread_mutex_t` + `pthread_cond_t`. `./monitor_bank unsafe` skips the monitor |
| `alg1_turn.c` | Algorithm 1. T0 wants in 3 times and T1 once, so T0 gets stuck |
| `alg2_flag.c` | Algorithm 2. A watchdog detects the deadlock |
| `bakery.c` | Lamport's bakery, 4 threads × 100,000 entries |
| Peterson | Use [`../critical-section/cs_peterson.c`](../critical-section/cs_peterson.c) |

```bash
cd monitors-and-algorithms
make run
```

Real output on the Ubuntu VM:

```
unsafe : 2 ATMs x 1,000,000 x (deposit 1, withdraw 1): balance = 501 (expected 100)
monitor: 2 ATMs x 1,000,000 x (deposit 1, withdraw 1): balance = 100 (expected 100)
[    1 ms] ATM1: withdraw(150), balance is only 100, waiting...
[ 1002 ms] ATM2: deposit(100)
[ 1003 ms] ATM1: got 150, balance now 50

T0: in critical section (entry 1)
T1: in critical section (entry 1)
T1: done, stays in its remainder section
T0: in critical section (entry 2)
after 2 s: T0 entered 2 of 3 times, turn = 1
NO PROGRESS: the critical section is free and T1 is not interested,
             but T0 still waits for turn == 0

DEADLOCK after T0 = 16989 and T1 = 6 entries
flag[0] = 1, flag[1] = 1: each thread waits for the other forever

bakery    : counter =  400000  expected 400000  lost 0  (244 ms)
largest ticket handed out: 313319,  spins on a tied ticket: 35919
```

Things to point out:
- The unsafe bank balance changes on every run (501, 237, 102). The monitor keeps it at exactly 100.
- Algorithm 2 deadlocks on every run. Only the number of entries before the deadlock varies.
- Bakery tickets keep growing while threads overlap (above 300,000 here). A ticket only resets when everyone is idle at the same time.
