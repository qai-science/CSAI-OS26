/* mq_demo.c (3.2) : message passing with a POSIX message queue (a mailbox) of capacity 2 */
#include <stdio.h>
#include <fcntl.h>
#include <mqueue.h>
#include <unistd.h>
#include <sys/wait.h>
#include "cs_timer.h"

int main(void) {
    setvbuf(stdout, NULL, _IONBF, 0);
    struct mq_attr at = { .mq_maxmsg = 2, .mq_msgsize = 32 };        /* bounded buffer, n = 2 */
    mq_unlink("/mbox");
    mqd_t q = mq_open("/mbox", O_CREAT | O_RDWR, 0666, &at);
    double t0 = now_ms();
    if (fork() == 0) {                                                /* receiver is slow */
        char m[32];
        for (int k = 0; k < 4; k++) {
            sleep(1);
            mq_receive(q, m, sizeof m, NULL);                        /* blocking receive */
            printf("[%5.0f ms] receiver: got  \"%s\"\n", now_ms() - t0, m);
        }
        _exit(0);
    }
    const char *msg[] = {"job-1", "job-2", "job-3", "job-4"};
    for (int k = 0; k < 4; k++) {
        printf("[%5.0f ms] sender  : send \"%s\"\n", now_ms() - t0, msg[k]);
        mq_send(q, msg[k], 6, 0);                                     /* blocks when the queue is full */
        printf("[%5.0f ms] sender  : \"%s\" is in the mailbox\n", now_ms() - t0, msg[k]);
    }
    wait(NULL);
    mq_unlink("/mbox");
    return 0;
}
