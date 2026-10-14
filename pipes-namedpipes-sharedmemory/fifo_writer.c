/* fifo_writer.c : named pipe; blocks until a reader opens /tmp/myfifo */
#include <stdio.h>
#include <string.h>
#include <fcntl.h>
#include <sys/stat.h>
#include <unistd.h>

int main(void) {
    mkfifo("/tmp/myfifo", 0666);   /* fails harmlessly if it already exists */
    printf("writer: waiting for a reader...\n");
    int fd = open("/tmp/myfifo", O_WRONLY);
    const char *msg = "hello through the FIFO";
    write(fd, msg, strlen(msg));
    printf("writer: sent \"%s\"\n", msg);
    close(fd);
    return 0;
}
