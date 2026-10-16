/* alg1_turn.c : Algorithm 1, strict alternation with one shared turn
 * T0 wants the critical section 3 times, T1 only once. */
#include <stdio.h>
#include <unistd.h>
#include <pthread.h>
#include <stdatomic.h>

atomic_int turn = 0;
atomic_int entries[2];

void *worker(void *arg) {
    int i = *(int *)arg, j = 1 - i;
    int wants = (i == 0) ? 3 : 1;
    for (int k = 0; k < wants; k++) {
        while (atomic_load(&turn) != i)
            ;                                  /* wait for my turn */
        printf("T%d: in critical section (entry %d)\n", i, k + 1);
        atomic_fetch_add(&entries[i], 1);
        atomic_store(&turn, j);                /* give the turn away */
    }
    printf("T%d: done, stays in its remainder section\n", i);
    return NULL;
}

int main(void) {
    setvbuf(stdout, NULL, _IONBF, 0);
    int id[2] = {0, 1};
    pthread_t t[2];
    for (int i = 0; i < 2; i++)
        pthread_create(&t[i], NULL, worker, &id[i]);
    sleep(2);
    printf("after 2 s: T0 entered %d of 3 times, turn = %d\n",
           atomic_load(&entries[0]), atomic_load(&turn));
    if (atomic_load(&entries[0]) < 3)
        printf("NO PROGRESS: the critical section is free and T1 is not interested,\n"
               "             but T0 still waits for turn == 0\n");
    return 0;                                  /* T0 is still spinning */
}
