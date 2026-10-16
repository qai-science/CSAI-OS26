/* monitor_buffer.c (3.11) : the BoundedBuffer monitor in C = mutex + notFull + notEmpty */
#include <stdio.h>
#include <pthread.h>

#define N 8
#define ITEMS 1000000
int buf[N], count = 0, in = 0, out = 0;
pthread_mutex_t m = PTHREAD_MUTEX_INITIALIZER;
pthread_cond_t notFull = PTHREAD_COND_INITIALIZER, notEmpty = PTHREAD_COND_INITIALIZER;
long full_waits = 0, empty_waits = 0;

void put(int x) {
    pthread_mutex_lock(&m);
    while (count == N) { full_waits++; pthread_cond_wait(&notFull, &m); }
    buf[in] = x; in = (in + 1) % N; count++;
    pthread_cond_signal(&notEmpty);
    pthread_mutex_unlock(&m);
}

int take(void) {
    pthread_mutex_lock(&m);
    while (count == 0) { empty_waits++; pthread_cond_wait(&notEmpty, &m); }
    int x = buf[out]; out = (out + 1) % N; count--;
    pthread_cond_signal(&notFull);
    pthread_mutex_unlock(&m);
    return x;
}

void *producer(void *a) { for (int i = 1; i <= ITEMS; i++) put(i); return NULL; }
void *consumer(void *a) {
    long bad = 0;
    for (int i = 1; i <= ITEMS; i++) if (take() != i) bad++;
    printf("consumer: %d items, %ld out of order\n", ITEMS, bad);
    return NULL;
}

int main(void) {
    pthread_t p, c;
    pthread_create(&p, NULL, producer, NULL);
    pthread_create(&c, NULL, consumer, NULL);
    pthread_join(p, NULL); pthread_join(c, NULL);
    printf("producer slept on notFull %ld times, consumer slept on notEmpty %ld times\n", full_waits, empty_waits);
    return 0;
}
