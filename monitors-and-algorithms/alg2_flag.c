/* alg2_flag.c : Algorithm 2, raise my flag, then wait while the other flag is up */
#include <stdio.h>
#include <unistd.h>
#include <pthread.h>
#include <stdatomic.h>

#define N 1000000
atomic_int flag[2];
atomic_long done[2];
volatile long counter = 0;

void *worker(void *arg) {
    int i = *(int *)arg, j = 1 - i;
    for (long k = 0; k < N; k++) {
        atomic_store(&flag[i], 1);             /* I want in */
        while (atomic_load(&flag[j]))
            ;                                  /* wait while you want in */
        counter++;                             /* critical section */
        atomic_store(&flag[i], 0);
        atomic_store(&done[i], k + 1);
    }
    return NULL;
}

int main(void) {
    int id[2] = {0, 1};
    pthread_t t[2];
    for (int i = 0; i < 2; i++)
        pthread_create(&t[i], NULL, worker, &id[i]);
    long last0 = -1, last1 = -1;
    for (;;) {
        usleep(500000);
        long d0 = atomic_load(&done[0]), d1 = atomic_load(&done[1]);
        if (d0 == N && d1 == N) {
            printf("finished: counter = %ld\n", counter);
            return 0;
        }
        if (d0 == last0 && d1 == last1) {
            printf("DEADLOCK after T0 = %ld and T1 = %ld entries\n", d0, d1);
            printf("flag[0] = %d, flag[1] = %d: each thread waits for the other forever\n",
                   atomic_load(&flag[0]), atomic_load(&flag[1]));
            return 1;
        }
        last0 = d0; last1 = d1;
    }
}
