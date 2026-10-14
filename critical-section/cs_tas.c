/* cs_tas.c : a spinlock built on the hardware TestAndSet instruction */
#include <stdio.h>
#include <pthread.h>
#include "cs_timer.h"

#define N 2000000
volatile long counter = 0;
char lock = 0;                         /* false = free */
long spins[2];

void *worker(void *arg) {
    int i = *(int *)arg;
    for (long k = 0; k < N; k++) {
        while (__atomic_test_and_set(&lock, __ATOMIC_ACQUIRE))   /* TestAndSet(&lock) */
            spins[i]++;                                          /* spin */
        counter++;                                               /* critical section */
        __atomic_clear(&lock, __ATOMIC_RELEASE);                 /* lock = false */
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
    printf("testandset: counter = %8ld  expected %d  lost %ld  (%.0f ms, %ld spins)\n",
           counter, 2 * N, 2L * N - counter, now_ms() - t, spins[0] + spins[1]);
    return 0;
}
