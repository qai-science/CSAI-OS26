/* dining.c (3.16) : five philosophers, five chopsticks
 *   ./dining          everyone picks up the left chopstick first (can deadlock)
 *   ./dining ordered  odd philosophers pick left first, even ones right first */
#include <stdio.h>
#include <string.h>
#include <unistd.h>
#include <pthread.h>
#include <semaphore.h>
#include <stdatomic.h>

#define P 5
sem_t chopstick[P];
atomic_long meals[P];
int ordered = 0;

void *philosopher(void *a) {
    int i = (int)(long)a, left = i, right = (i + 1) % P;
    int first = left, second = right;
    if (ordered && i % 2 == 0) { first = right; second = left; }
    for (;;) {
        sem_wait(&chopstick[first]);
        usleep(100);                           /* a pause makes the deadlock likely */
        sem_wait(&chopstick[second]);
        atomic_fetch_add(&meals[i], 1);        /* eat */
        sem_post(&chopstick[second]);
        sem_post(&chopstick[first]);
    }
}

int main(int argc, char **argv) {
    ordered = argc > 1 && strcmp(argv[1], "ordered") == 0;
    for (int i = 0; i < P; i++) sem_init(&chopstick[i], 0, 1);
    pthread_t t[P];
    for (long i = 0; i < P; i++) pthread_create(&t[i], NULL, philosopher, (void *)i);
    long last = -1;
    for (int s = 1; s <= 6; s++) {
        sleep(1);
        long total = 0; for (int i = 0; i < P; i++) total += meals[i];
        if (total == last) {
            printf("DEADLOCK after %ld meals: every philosopher holds one chopstick and waits for the next\n", total);
            return 1;
        }
        last = total;
    }
    printf("%s: no deadlock in 6 s, meals per philosopher:", ordered ? "ordered" : "left-first");
    for (int i = 0; i < P; i++) printf(" P%d=%ld", i, meals[i]);
    printf("\n");
    return 0;
}
