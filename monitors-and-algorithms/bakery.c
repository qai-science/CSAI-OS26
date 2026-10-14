/* bakery.c : Lamport's bakery algorithm for n = 4 threads (C11 seq_cst atomics) */
#include <stdio.h>
#include <pthread.h>
#include <stdatomic.h>
#include "cs_timer.h"

#define NT 4
#define N 100000
atomic_int choosing[NT], number[NT];
atomic_int maxticket, ties;
volatile long counter = 0;

static int max_number(void) {
    int m = 0;
    for (int k = 0; k < NT; k++) {
        int v = atomic_load(&number[k]);
        if (v > m) m = v;
    }
    return m;
}

void lock(int i) {
    atomic_store(&choosing[i], 1);
    int mine = 1 + max_number();                       /* take a ticket */
    atomic_store(&number[i], mine);
    atomic_store(&choosing[i], 0);
    for (int j = 0; j < NT; j++) {
        if (j == i) continue;
        while (atomic_load(&choosing[j]))
            ;                                          /* j is still picking */
        for (;;) {
            int nj = atomic_load(&number[j]);
            if (nj == 0 || nj > mine || (nj == mine && j > i)) break;
            if (nj == mine) atomic_fetch_add(&ties, 1);
        }                                              /* (number[j], j) < (mine, i): wait */
    }
    if (mine > atomic_load(&maxticket)) atomic_store(&maxticket, mine);
}

void unlock(int i) { atomic_store(&number[i], 0); }

void *worker(void *arg) {
    int i = *(int *)arg;
    for (long k = 0; k < N; k++) {
        lock(i);
        counter++;                                     /* critical section */
        unlock(i);
    }
    return NULL;
}

int main(void) {
    int id[NT];
    pthread_t t[NT];
    double t0 = now_ms();
    for (int i = 0; i < NT; i++) { id[i] = i; pthread_create(&t[i], NULL, worker, &id[i]); }
    for (int i = 0; i < NT; i++) pthread_join(t[i], NULL);
    printf("bakery    : counter = %7ld  expected %d  lost %ld  (%.0f ms)\n",
           counter, NT * N, (long)NT * N - counter, now_ms() - t0);
    printf("largest ticket handed out: %d,  spins on a tied ticket: %d\n",
           atomic_load(&maxticket), atomic_load(&ties));
    return 0;
}
