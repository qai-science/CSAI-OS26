PROGS = monitor_bank alg1_turn alg2_flag bakery
CFLAGS = -O2 -Wall -pthread
all: $(PROGS)
%: %.c cs_timer.h ; gcc $(CFLAGS) -o $@ $<
run: all
	./monitor_bank unsafe; ./monitor_bank; ./alg1_turn; ./alg2_flag; ./bakery
clean: ; rm -f $(PROGS)
