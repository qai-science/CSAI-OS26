/* race_count.c (3.5) : count = 5, a producer does count++ and a consumer count-- a million times each */
#include <stdio.h>
#include <pthread.h>

#define N 1000000
volatile long count = 5;
pthread_barrier_t start;

void *producer(void *a) { pthread_barrier_wait(&start); for (long k = 0; k < N; k++) count++; return NULL; }
void *consumer(void *a) { pthread_barrier_wait(&start); for (long k = 0; k < N; k++) count--; return NULL; }

int main(void) {
    for (int run = 1; run <= 5; run++) {
        count = 5;
        pthread_barrier_init(&start, NULL, 2);
        pthread_t p, c;
        pthread_create(&p, NULL, producer, NULL);
        pthread_create(&c, NULL, consumer, NULL);
        pthread_join(p, NULL); pthread_join(c, NULL);
        printf("run %d: count = %ld  (should be 5)\n", run, count);
    }
    return 0;
}
