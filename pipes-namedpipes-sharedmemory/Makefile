PROGS = shm_writer shm_reader pipe_demo fifo_writer fifo_reader sem_writer sem_reader sem_counting
all: $(PROGS)
shm_%: shm_%.c ; gcc -Wall -o $@ $< -lrt
sem_%: sem_%.c ; gcc -Wall -o $@ $< -pthread -lrt
%: %.c ; gcc -Wall -o $@ $<
clean: ; rm -f $(PROGS)
