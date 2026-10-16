/* sem_order.c : synch = 0 forces S1 (in P1) to happen before S2 (in P2) */
#include <stdio.h>
#include <unistd.h>
#include <pthread.h>
#include <semaphore.h>
#include "cs_timer.h"

sem_t synch;
double t0;

void *P1(void *arg) {
    sleep(2);                          /* P1 is slow to reach S1 */
    printf("[%5.0f ms] P1: S1  (write the result)\n", now_ms() - t0);
    sem_post(&synch);                  /* signal(synch) */
    return NULL;
}

void *P2(void *arg) {
    printf("[%5.0f ms] P2: wait(synch), S1 not done yet\n", now_ms() - t0);
    sem_wait(&synch);                  /* wait(synch) */
    printf("[%5.0f ms] P2: S2  (read the result)\n", now_ms() - t0);
    return NULL;
}

int main(void) {
    setvbuf(stdout, NULL, _IONBF, 0);
    sem_init(&synch, 0, 0);            /* 0 = S1 has not happened yet */
    pthread_t a, b;
    t0 = now_ms();
    pthread_create(&b, NULL, P2, NULL);   /* start P2 first on purpose */
    pthread_create(&a, NULL, P1, NULL);
    pthread_join(a, NULL);
    pthread_join(b, NULL);
    sem_destroy(&synch);
    return 0;
}
