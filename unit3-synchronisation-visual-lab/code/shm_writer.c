/* shm_writer.c : creates /frames, writes a message, waits, then unlinks */
#include <stdio.h>
#include <fcntl.h>
#include <sys/mman.h>
#include <unistd.h>

int main(void) {
    int fd = shm_open("/frames", O_CREAT | O_RDWR, 0666);
    ftruncate(fd, 4096);
    char *p = mmap(0, 4096, PROT_READ | PROT_WRITE, MAP_SHARED, fd, 0);

    sprintf(p, "hello");                       /* writer */
    printf("writer: wrote \"%s\" into /frames\n", p);
    printf("writer: now run ./shm_reader in another terminal, then press Enter\n");
    getchar();

    munmap(p, 4096);
    close(fd);
    shm_unlink("/frames");                     /* at the end */
    printf("writer: /frames unlinked\n");
    return 0;
}
