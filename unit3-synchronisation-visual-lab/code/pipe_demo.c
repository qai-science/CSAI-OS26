/* pipe_demo.c : unnamed pipe between parent (writer) and child (reader) */
#include <stdio.h>
#include <string.h>
#include <unistd.h>
#include <sys/wait.h>

int main(void) {
    int fd[2];                     /* fd[0] = read end, fd[1] = write end */
    char buf[64];
    pipe(fd);

    if (fork() == 0) {             /* child: reader */
        close(fd[1]);
        int n = read(fd[0], buf, sizeof buf - 1);
        buf[n] = '\0';
        printf("child  (pid %d): got \"%s\"\n", getpid(), buf);
        close(fd[0]);
        return 0;
    }
    close(fd[0]);                  /* parent: writer */
    const char *msg = "hello through the pipe";
    write(fd[1], msg, strlen(msg));
    printf("parent (pid %d): sent \"%s\"\n", getpid(), msg);
    close(fd[1]);
    wait(NULL);
    return 0;
}
