#!/bin/sh

qw=../quickwit-v0.5.0/quickwit

$qw index create --index-config config.yaml
$qw index ingest --index foo --input-path foo.jsonl
sleep 2
$qw index search --index foo --query application
$qw index delete -y --index foo
