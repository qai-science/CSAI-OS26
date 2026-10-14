all: shm_writer shm_reader pipe_demo fifo_writer fifo_reader
shm_%: shm_%.c ; gcc -Wall -o $@ $< -lrt
%: %.c ; gcc -Wall -o $@ $<
clean: ; rm -f shm_writer shm_reader pipe_demo fifo_writer fifo_reader
