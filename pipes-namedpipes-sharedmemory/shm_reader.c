/* shm_reader.c : opens the existing /frames and prints its bytes */
#include <stdio.h>
#include <fcntl.h>
#include <sys/mman.h>
#include <unistd.h>

int main(void) {
    int fd = shm_open("/frames", O_RDONLY, 0666);
    if (fd < 0) { perror("shm_open (start the writer first)"); return 1; }
    char *p = mmap(0, 4096, PROT_READ, MAP_SHARED, fd, 0);
    printf("reader: read \"%s\" from /frames\n", p);
    munmap(p, 4096);
    close(fd);
    return 0;
}
