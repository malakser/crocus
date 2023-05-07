#!/bin/sh

qw=../quickwit/quickwit

$qw index delete -y --index foo
$qw index create --index-config config.yaml
$qw index ingest --index foo --input-path ../data/pages.jsonl
