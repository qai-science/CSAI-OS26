/* fifo_reader.c : reads from the named pipe /tmp/myfifo */
#include <stdio.h>
#include <fcntl.h>
#include <unistd.h>

int main(void) {
    char buf[64];
    int fd = open("/tmp/myfifo", O_RDONLY);
    int n = read(fd, buf, sizeof buf - 1);
    buf[n] = '\0';
    printf("reader: got \"%s\"\n", buf);
    close(fd);
    unlink("/tmp/myfifo");
    return 0;
}
