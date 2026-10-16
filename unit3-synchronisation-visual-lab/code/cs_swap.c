/* cs_swap.c : a spinlock built on the hardware atomic Swap (exchange) */
#include <stdio.h>
#include <pthread.h>
#include "cs_timer.h"

#define N 2000000
volatile long counter = 0;
int lock = 0;                          /* 0 = free */
long spins[2];

void *worker(void *arg) {
    int i = *(int *)arg;
    for (long k = 0; k < N; k++) {
        int key = 1;                                             /* key = true */
        while (key == 1) {
            key = __atomic_exchange_n(&lock, 1, __ATOMIC_ACQUIRE);   /* Swap(&lock, &key) */
            if (key) spins[i]++;
        }
        counter++;                                               /* critical section */
        __atomic_store_n(&lock, 0, __ATOMIC_RELEASE);            /* lock = false */
    }
    return NULL;
}

int main(void) {
    int id[2] = {0, 1};
    pthread_t t0, t1;
    double t = now_ms();
    pthread_create(&t0, NULL, worker, &id[0]);
    pthread_create(&t1, NULL, worker, &id[1]);
    pthread_join(t0, NULL);
    pthread_join(t1, NULL);
    printf("swap      : counter = %8ld  expected %d  lost %ld  (%.0f ms, %ld spins)\n",
           counter, 2 * N, 2L * N - counter, now_ms() - t, spins[0] + spins[1]);
    return 0;
}
