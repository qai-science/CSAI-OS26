# 3.7–3.10 The Critical-Section Problem: software, hardware, mutex and semaphores

**Interactive simulation:** [open the critical section lab](https://qai-science.github.io/CSAI-OS26/critical-section/simulation/) (source: [`simulation/index.html`](simulation/index.html), a single file that also works offline). It has 7 tabs: race, Peterson, TestAndSet, Swap, mutex, binary semaphore and ordering with `synch = 0`. Each tab has a guided tour, and a **You are the scheduler** mode where you pick which thread runs next and try to break mutual exclusion.

Every program runs two threads that each do `counter++` 2,000,000 times, so the right answer is 4,000,000.

| File | Shows |
|---|---|
| `cs_race.c` | No protection: updates are lost |
| `cs_peterson.c` | Peterson's software solution. `./cs_peterson plain` is the textbook code (it breaks on real CPUs); `./cs_peterson` uses C11 atomics |
| `cs_tas.c` | Spinlock on the hardware **TestAndSet** (`__atomic_test_and_set`, compiles to x86 `xchg`) |
| `cs_swap.c` | Spinlock on the hardware atomic **Swap** (`__atomic_exchange_n`) |
| `cs_mutex.c` | `pthread_mutex_lock` / `unlock`: waiting threads sleep |
| `cs_binsem.c` | Binary semaphore starting at 1 (`sem_wait` = wait, `sem_post` = signal) |
| `sem_order.c` | Binary semaphore `synch = 0`: S1 in P1 always happens before S2 in P2 |

## Build and run

```bash
cd critical-section
make run
```

Real output on the Ubuntu VM (8-core Intel Core Ultra 5):

```
race      : counter =  2341458  expected 4000000  lost 1658542  (10 ms)
peterson-p: counter =  3999968  expected 4000000  lost 32  (941 ms)
peterson  : counter =  4000000  expected 4000000  lost 0  (1330 ms)
testandset: counter =  4000000  expected 4000000  lost 0  (412 ms, 3209122 spins)
swap      : counter =  4000000  expected 4000000  lost 0  (471 ms, 4105787 spins)
mutex     : counter =  4000000  expected 4000000  lost 0  (560 ms)
binsem    : counter =  4000000  expected 4000000  lost 0  (1270 ms)
[    1 ms] P2: wait(synch), S1 not done yet
[ 2023 ms] P1: S1  (write the result)
[ 2026 ms] P2: S2  (read the result)
```

Things to point out:
- `cs_race` gives a **different wrong answer every run**. That is what a race condition looks like.
- `cs_peterson plain` loses a few dozen updates. The CPU's store buffer lets a later load overtake the earlier store, so both threads read the other's flag as false. Peterson is only correct with memory fences.
- See the hardware instruction for yourself:
  ```bash
  objdump -d cs_tas | grep -A1 xchg
  ```
  `TestAndSet` becomes `xchg %al, lock`, and `lock = false` is a plain `movb $0x0`.
- Spinlocks win here only because the critical section is one instruction long. The mutex and semaphore make waiting threads sleep instead of burning CPU.
