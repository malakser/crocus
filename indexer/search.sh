#!/bin/sh

qw=../quickwit-v0.5.0/quickwit
$qw index search --query $1 --index foo --snippet-fields body
