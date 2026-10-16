/* cs_peterson.c : Peterson's software solution for two threads
 *   ./cs_peterson         flag/turn are sequentially consistent atomics
 *   ./cs_peterson plain   flag/turn are plain volatile ints (breaks on real CPUs) */
#include <stdio.h>
#include <string.h>
#include <pthread.h>
#include <stdatomic.h>
#include "cs_timer.h"

#define N 2000000
volatile long counter = 0;
int plain = 0;

atomic_int flag[2], turn;              /* correct version */
volatile int vflag[2], vturn;          /* textbook code, no memory ordering */

void enter(int i) {
    int j = 1 - i;
    if (plain) {
        vflag[i] = 1;                  /* I want to enter */
        vturn = j;                     /* but you go first */
        while (vflag[j] && vturn == j)
            ;                          /* spin */
    } else {
        atomic_store(&flag[i], 1);
        atomic_store(&turn, j);
        while (atomic_load(&flag[j]) && atomic_load(&turn) == j)
            ;
    }
}

void leave(int i) {
    if (plain) vflag[i] = 0;
    else atomic_store(&flag[i], 0);
}

void *worker(void *arg) {
    int i = *(int *)arg;
    for (long k = 0; k < N; k++) {
        enter(i);
        counter++;                     /* critical section */
        leave(i);
    }
    return NULL;
}

int main(int argc, char **argv) {
    plain = argc > 1 && strcmp(argv[1], "plain") == 0;
    int id[2] = {0, 1};
    pthread_t t0, t1;
    double t = now_ms();
    pthread_create(&t0, NULL, worker, &id[0]);
    pthread_create(&t1, NULL, worker, &id[1]);
    pthread_join(t0, NULL);
    pthread_join(t1, NULL);
    printf("peterson%s: counter = %8ld  expected %d  lost %ld  (%.0f ms)\n",
           plain ? "-p" : "  ", counter, 2 * N, 2L * N - counter, now_ms() - t);
    return 0;
}
