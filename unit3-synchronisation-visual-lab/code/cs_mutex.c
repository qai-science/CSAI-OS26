/* cs_mutex.c : the same counter protected by a pthread mutex */
#include <stdio.h>
#include <pthread.h>
#include "cs_timer.h"

#define N 2000000
volatile long counter = 0;
pthread_mutex_t m = PTHREAD_MUTEX_INITIALIZER;

void *worker(void *arg) {
    for (long k = 0; k < N; k++) {
        pthread_mutex_lock(&m);        /* sleeps if another thread owns it */
        counter++;                     /* critical section */
        pthread_mutex_unlock(&m);      /* wakes a sleeping thread, if any */
    }
    return NULL;
}

int main(void) {
    pthread_t t0, t1;
    double t = now_ms();
    pthread_create(&t0, NULL, worker, NULL);
    pthread_create(&t1, NULL, worker, NULL);
    pthread_join(t0, NULL);
    pthread_join(t1, NULL);
    printf("mutex     : counter = %8ld  expected %d  lost %ld  (%.0f ms)\n",
           counter, 2 * N, 2L * N - counter, now_ms() - t);
    return 0;
}
