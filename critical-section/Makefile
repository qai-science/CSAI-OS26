PROGS = cs_race cs_peterson cs_tas cs_swap cs_mutex cs_binsem sem_order
CFLAGS = -O2 -Wall -pthread
all: $(PROGS)
%: %.c cs_timer.h ; gcc $(CFLAGS) -o $@ $<
run: all
	./cs_race; ./cs_peterson plain; ./cs_peterson; ./cs_tas; ./cs_swap; ./cs_mutex; ./cs_binsem; ./sem_order
clean: ; rm -f $(PROGS)
