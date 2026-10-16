/* sem_writer.c : shared memory + a named semaphore that says "data ready" */
#include <stdio.h>
#include <fcntl.h>
#include <semaphore.h>
#include <sys/mman.h>
#include <unistd.h>

int main(void) {
    sem_t *ready = sem_open("/ready", O_CREAT, 0666, 0);   /* starts at 0 */
    int fd = shm_open("/frames", O_CREAT | O_RDWR, 0666);
    ftruncate(fd, 4096);
    char *p = mmap(0, 4096, PROT_READ | PROT_WRITE, MAP_SHARED, fd, 0);

    printf("writer: preparing the frame...\n");
    sleep(3);                                  /* a slow producer */
    sprintf(p, "hello");
    printf("writer: wrote \"%s\", posting /ready\n", p);
    sem_post(ready);                           /* 0 -> 1, wakes the reader */

    munmap(p, 4096);
    close(fd);
    sem_close(ready);
    return 0;
}
