# CSEG2060 Unit III: every program builds the same way
CFLAGS = -O2 -Wall -pthread
LDLIBS = -lrt
SRC   := $(wildcard *.c)
PROGS := $(SRC:.c=)

all: $(PROGS)
%: %.c cs_timer.h ; gcc $(CFLAGS) -o $@ $< $(LDLIBS)
clean: ; rm -f $(PROGS)
.PHONY: all clean
