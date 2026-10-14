/* cs_race.c : two threads do counter++ with no protection at all */
#include <stdio.h>
#include <pthread.h>
#include "cs_timer.h"

#define N 2000000
volatile long counter = 0;
pthread_barrier_t start;               /* both threads begin together */

void *worker(void *arg) {
    pthread_barrier_wait(&start);
    for (long k = 0; k < N; k++)
        counter++;                     /* load, add, store: three steps */
    return NULL;
}

int main(void) {
    pthread_t t0, t1;
    pthread_barrier_init(&start, NULL, 2);
    double t = now_ms();
    pthread_create(&t0, NULL, worker, NULL);
    pthread_create(&t1, NULL, worker, NULL);
    pthread_join(t0, NULL);
    pthread_join(t1, NULL);
    printf("race      : counter = %8ld  expected %d  lost %ld  (%.0f ms)\n",
           counter, 2 * N, 2L * N - counter, now_ms() - t);
    return 0;
}
