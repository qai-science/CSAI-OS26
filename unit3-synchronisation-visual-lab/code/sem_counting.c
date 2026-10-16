/* sem_counting.c : 4 processes share 2 slots guarded by a counting semaphore */
#include <stdio.h>
#include <fcntl.h>
#include <semaphore.h>
#include <unistd.h>
#include <sys/wait.h>

int main(void) {
    setvbuf(stdout, NULL, _IONBF, 0);          /* print immediately */
    sem_unlink("/slots");                      /* remove a stale one */
    sem_t *slots = sem_open("/slots", O_CREAT, 0666, 2);   /* 2 slots */

    for (int i = 1; i <= 4; i++) {
        if (fork() == 0) {
            printf("P%d: waiting for a slot\n", i);
            sem_wait(slots);                   /* take a slot or sleep */
            printf("P%d: got a slot, working\n", i);
            sleep(2);                          /* critical section */
            printf("P%d: done, releasing\n", i);
            sem_post(slots);                   /* give the slot back */
            return 0;
        }
        usleep(100000);                        /* stagger the starts */
    }
    while (wait(NULL) > 0)
        ;
    sem_unlink("/slots");
    return 0;
}
