/* sem_reader.c : waits on /ready before it touches the shared memory */
#include <stdio.h>
#include <fcntl.h>
#include <semaphore.h>
#include <sys/mman.h>
#include <unistd.h>

int main(void) {
    sem_t *ready = sem_open("/ready", O_CREAT, 0666, 0);
    int fd = shm_open("/frames", O_CREAT | O_RDWR, 0666);
    ftruncate(fd, 4096);
    char *p = mmap(0, 4096, PROT_READ, MAP_SHARED, fd, 0);

    printf("reader: waiting on /ready...\n");
    sem_wait(ready);                           /* blocks while the value is 0 */
    printf("reader: read \"%s\" from /frames\n", p);

    munmap(p, 4096);
    close(fd);
    sem_close(ready);
    sem_unlink("/ready");
    shm_unlink("/frames");
    return 0;
}
