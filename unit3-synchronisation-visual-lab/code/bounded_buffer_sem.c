/* bounded_buffer_sem.c (3.16) : producer-consumer with mutex = 1, empty = 8, full = 0
 *   ./bounded_buffer_sem         correct order: wait(empty) then wait(mutex)
 *   ./bounded_buffer_sem wrong   wrong order:   wait(mutex) then wait(empty) */
#include <stdio.h>
#include <string.h>
#include <unistd.h>
#include <pthread.h>
#include <semaphore.h>
#include <stdatomic.h>

#define N 8
#define ITEMS 1000000
int buf[N], in = 0, out = 0, wrong = 0;
sem_t mutex, empty, full;
atomic_long produced, consumed;

void *producer(void *a) {
    for (int item = 1; item <= ITEMS; item++) {
        if (wrong) { sem_wait(&mutex); sem_wait(&empty); }
        else       { sem_wait(&empty); sem_wait(&mutex); }
        buf[in] = item; in = (in + 1) % N;
        sem_post(&mutex); sem_post(&full);
        atomic_store(&produced, item);
    }
    return NULL;
}

void *consumer(void *a) {
    long bad = 0;
    for (int expect = 1; expect <= ITEMS; expect++) {
        sem_wait(&full); sem_wait(&mutex);
        if (buf[out] != expect) bad++;
        out = (out + 1) % N;
        sem_post(&mutex); sem_post(&empty);
        atomic_store(&consumed, expect);
        if (wrong && expect % 1000 == 0) usleep(1);     /* let the buffer fill up */
    }
    printf("consumer: got all %d items, %ld out of order\n", ITEMS, bad);
    return NULL;
}

int main(int argc, char **argv) {
    wrong = argc > 1 && strcmp(argv[1], "wrong") == 0;
    sem_init(&mutex, 0, 1); sem_init(&empty, 0, N); sem_init(&full, 0, 0);
    pthread_t p, c;
    pthread_create(&p, NULL, producer, NULL);
    pthread_create(&c, NULL, consumer, NULL);
    long lp = -1, lc = -1;
    for (;;) {
        usleep(300000);
        long np = atomic_load(&produced), nc = atomic_load(&consumed);
        if (np == ITEMS && nc == ITEMS) { pthread_join(p, NULL); pthread_join(c, NULL); printf("%s order: finished, mutex = 1, empty = 8, full = 0 again\n", wrong ? "wrong" : "correct"); return 0; }
        if (np == lp && nc == lc) {
            int e, f, m; sem_getvalue(&empty, &e); sem_getvalue(&full, &f); sem_getvalue(&mutex, &m);
            printf("DEADLOCK (%s order) after %ld produced, %ld consumed: mutex = %d, empty = %d, full = %d\n", wrong ? "wrong" : "correct", np, nc, m, e, f);
            printf("the producer holds mutex and sleeps on empty; the consumer sleeps on mutex\n");
            return 1;
        }
        lp = np; lc = nc;
    }
}
