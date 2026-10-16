/* readers_writers.c (3.16) : first readers-writers solution (readers preferred)
 * 4 readers read continuously; one writer wants to write once. */
#include <stdio.h>
#include <unistd.h>
#include <pthread.h>
#include <semaphore.h>
#include <stdatomic.h>
#include "cs_timer.h"

sem_t rw_mutex, mutex;
int read_count = 0, max_readers = 0;
atomic_int stop = 0;
double t0;

void *reader(void *a) {
    while (!atomic_load(&stop)) {
        sem_wait(&mutex); read_count++;
        if (read_count == 1) sem_wait(&rw_mutex);   /* first reader locks out writers */
        if (read_count > max_readers) max_readers = read_count;
        sem_post(&mutex);
        usleep(2000);                               /* ... read ... */
        sem_wait(&mutex); read_count--;
        if (read_count == 0) sem_post(&rw_mutex);   /* last reader lets writers in */
        sem_post(&mutex);
    }
    return NULL;
}

void *writer(void *a) {
    printf("[%6.0f ms] writer: wants to write\n", now_ms() - t0);
    sem_wait(&rw_mutex);
    printf("[%6.0f ms] writer: WRITING (alone)\n", now_ms() - t0);
    sem_post(&rw_mutex);
    return NULL;
}

int main(void) {
    setvbuf(stdout, NULL, _IONBF, 0);
    sem_init(&rw_mutex, 0, 1); sem_init(&mutex, 0, 1);
    pthread_t r[4], w;
    t0 = now_ms();
    for (int i = 0; i < 4; i++) { pthread_create(&r[i], NULL, reader, NULL); usleep(500); }
    usleep(10000);
    pthread_create(&w, NULL, writer, NULL);
    sleep(3);
    printf("[%6.0f ms] after 3 s: up to %d readers read together; stopping the readers\n", now_ms() - t0, max_readers);
    atomic_store(&stop, 1);
    for (int i = 0; i < 4; i++) pthread_join(r[i], NULL);
    pthread_join(w, NULL);
    return 0;
}
