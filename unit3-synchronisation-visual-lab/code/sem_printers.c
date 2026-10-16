/* sem_printers.c (3.9) : 6 print jobs share 3 printers through a counting semaphore */
#include <stdio.h>
#include <unistd.h>
#include <pthread.h>
#include <semaphore.h>
#include "cs_timer.h"

sem_t printers;
double t0;

void *job(void *arg) {
    long id = (long)arg;
    sem_wait(&printers);                       /* wait(printers) */
    int v; sem_getvalue(&printers, &v);
    printf("[%5.0f ms] job %ld: printing   (free printers now %d)\n", now_ms() - t0, id, v);
    sleep(1);
    printf("[%5.0f ms] job %ld: done\n", now_ms() - t0, id);
    sem_post(&printers);                       /* signal(printers) */
    return NULL;
}

int main(void) {
    setvbuf(stdout, NULL, _IONBF, 0);
    sem_init(&printers, 0, 3);                 /* printers = 3 */
    pthread_t t[6];
    t0 = now_ms();
    for (long i = 0; i < 6; i++) { pthread_create(&t[i], NULL, job, (void *)(i + 1)); usleep(20000); }
    for (int i = 0; i < 6; i++) pthread_join(t[i], NULL);
    return 0;
}
