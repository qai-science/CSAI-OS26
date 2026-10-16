/* cli_demo.c (3.7) : can a user program disable interrupts? Try the x86 cli instruction. */
#include <stdio.h>
#include <signal.h>
#include <stdlib.h>
#include <unistd.h>

void refused(int sig) {
    printf("the CPU refused: cli is a privileged instruction (signal %d, SIGSEGV)\n", sig);
    printf("only the kernel, in ring 0, may disable interrupts\n");
    exit(0);
}

int main(void) {
    signal(SIGSEGV, refused);
    printf("user program: trying to disable interrupts with cli ...\n");
#if defined(__x86_64__) || defined(__i386__)
    __asm__ volatile("cli");
    printf("interrupts disabled?! (this line should never print)\n");
#else
    printf("not an x86 CPU, skipping\n");
#endif
    return 0;
}
