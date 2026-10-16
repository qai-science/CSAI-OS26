/* prodcons_inout.c (3.6) : bounded buffer of 8 slots with only in and out (busy waiting) */
#include <stdio.h>
#include <pthread.h>
#include <stdatomic.h>

#define BUF 8
#define ITEMS 2000000
int buffer[BUF];
atomic_int in = 0, out = 0;
int max_held = 0;

void *producer(void *a) {
    for (int item = 1; item <= ITEMS; item++) {
        while (((atomic_load(&in) + 1) % BUF) == atomic_load(&out))
            ;                                          /* full: wait */
        buffer[in] = item;
        atomic_store(&in, (in + 1) % BUF);
        int held = (atomic_load(&in) - atomic_load(&out) + BUF) % BUF;
        if (held > max_held) max_held = held;
    }
    return NULL;
}

void *consumer(void *a) {
    long errors = 0;
    for (int expect = 1; expect <= ITEMS; expect++) {
        while (atomic_load(&in) == atomic_load(&out))
            ;                                          /* empty: wait */
        if (buffer[out] != expect) errors++;
        atomic_store(&out, (out + 1) % BUF);
    }
    printf("consumer: received %d items in order, %ld out of order\n", ITEMS, errors);
    return NULL;
}

int main(void) {
    pthread_t p, c;
    pthread_create(&p, NULL, producer, NULL);
    pthread_create(&c, NULL, consumer, NULL);
    pthread_join(p, NULL); pthread_join(c, NULL);
    printf("buffer has %d slots, most items ever held at once = %d\n", BUF, max_held);
    return 0;
}
