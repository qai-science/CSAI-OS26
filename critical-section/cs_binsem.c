/* cs_binsem.c : a binary semaphore that starts at 1 guards the counter */
#include <stdio.h>
#include <pthread.h>
#include <semaphore.h>
#include "cs_timer.h"

#define N 2000000
volatile long counter = 0;
sem_t mutex;

void *worker(void *arg) {
    for (long k = 0; k < N; k++) {
        sem_wait(&mutex);              /* wait(mutex): take the key */
        counter++;                     /* critical section */
        sem_post(&mutex);              /* signal(mutex): return the key */
    }
    return NULL;
}

int main(void) {
    sem_init(&mutex, 0, 1);            /* 1 = the key is on the desk */
    pthread_t t0, t1;
    double t = now_ms();
    pthread_create(&t0, NULL, worker, NULL);
    pthread_create(&t1, NULL, worker, NULL);
    pthread_join(t0, NULL);
    pthread_join(t1, NULL);
    printf("binsem    : counter = %8ld  expected %d  lost %ld  (%.0f ms)\n",
           counter, 2 * N, 2L * N - counter, now_ms() - t);
    sem_destroy(&mutex);
    return 0;
}
