/* monitor_bank.c : a bank-account monitor in C = shared data + mutex + condition variable
 *   ./monitor_bank          use the monitor procedures
 *   ./monitor_bank unsafe   touch the balance directly, with no monitor */
#include <stdio.h>
#include <string.h>
#include <unistd.h>
#include <pthread.h>
#include "cs_timer.h"

typedef struct {
    pthread_mutex_t lock;                      /* the monitor lock: one thread inside */
    pthread_cond_t  funds;                     /* condition: "the balance went up" */
    volatile long balance;                     /* shared data */
} Account;

Account account = { PTHREAD_MUTEX_INITIALIZER, PTHREAD_COND_INITIALIZER, 100 };   /* initialisation */
int unsafe = 0;
double t0;

void deposit(Account *a, long x) {
    if (unsafe) { a->balance += x; return; }
    pthread_mutex_lock(&a->lock);              /* enter the monitor */
    a->balance += x;
    pthread_cond_signal(&a->funds);            /* wake one waiting withdrawer */
    pthread_mutex_unlock(&a->lock);            /* leave the monitor */
}

void withdraw(Account *a, long x) {
    if (unsafe) { a->balance -= x; return; }
    pthread_mutex_lock(&a->lock);
    while (a->balance < x)
        pthread_cond_wait(&a->funds, &a->lock);    /* release the lock and sleep */
    a->balance -= x;
    pthread_mutex_unlock(&a->lock);
}

void *atm(void *arg) {
    for (int k = 0; k < 1000000; k++) { deposit(&account, 1); withdraw(&account, 1); }
    return NULL;
}

void *big_withdraw(void *arg) {
    printf("[%5.0f ms] ATM1: withdraw(150), balance is only %ld, waiting...\n", now_ms() - t0, account.balance);
    withdraw(&account, 150);
    printf("[%5.0f ms] ATM1: got 150, balance now %ld\n", now_ms() - t0, account.balance);
    return NULL;
}

int main(int argc, char **argv) {
    setvbuf(stdout, NULL, _IONBF, 0);
    unsafe = argc > 1 && strcmp(argv[1], "unsafe") == 0;
    pthread_t a, b;
    pthread_create(&a, NULL, atm, NULL);
    pthread_create(&b, NULL, atm, NULL);
    pthread_join(a, NULL);
    pthread_join(b, NULL);
    printf("%s: 2 ATMs x 1,000,000 x (deposit 1, withdraw 1): balance = %ld (expected 100)\n",
           unsafe ? "unsafe " : "monitor", account.balance);
    if (unsafe) return 0;

    account.balance = 100;
    t0 = now_ms();
    pthread_create(&a, NULL, big_withdraw, NULL);
    sleep(1);
    printf("[%5.0f ms] ATM2: deposit(100)\n", now_ms() - t0);
    deposit(&account, 100);
    pthread_join(a, NULL);
    return 0;
}
