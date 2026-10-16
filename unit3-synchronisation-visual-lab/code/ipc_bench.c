/* ipc_bench.c (3.2) : move 100 MB between two processes by shared memory and by a pipe */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/mman.h>
#include <sys/wait.h>
#include "cs_timer.h"

#define SIZE (100L * 1024 * 1024)

int main(void) {
    char *src = malloc(SIZE);
    memset(src, 'x', SIZE);

    /* shared memory: the child writes the region, the parent sees it with no copy */
    char *shm = mmap(NULL, SIZE, PROT_READ | PROT_WRITE, MAP_SHARED | MAP_ANONYMOUS, -1, 0);
    double t = now_ms();
    if (fork() == 0) { memcpy(shm, src, SIZE); _exit(0); }
    wait(NULL);
    printf("shared memory : 100 MB in %6.1f ms  (one copy into the shared region, kernel only at set-up)\n", now_ms() - t);

    /* message passing: the bytes go through the kernel, 64 KB at a time */
    int fd[2]; pipe(fd);
    char *dst = malloc(SIZE);
    t = now_ms();
    if (fork() == 0) {
        close(fd[0]);
        for (long off = 0; off < SIZE; ) off += write(fd[1], src + off, SIZE - off);
        _exit(0);
    }
    close(fd[1]);
    long got = 0, calls = 0;
    for (ssize_t n; (n = read(fd[0], dst + got, SIZE - got)) > 0; got += n) calls++;
    wait(NULL);
    printf("pipe (kernel) : 100 MB in %6.1f ms  (%ld read() system calls, two copies per byte)\n", now_ms() - t, calls);
    return 0;
}
