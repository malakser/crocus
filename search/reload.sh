#!/bin/sh

qw=../quickwit-v0.5.0/quickwit

$qw index delete -y --index foo
$qw index create --index-config config.yaml
$qw index ingest --index foo --input-path foo.jsonl
