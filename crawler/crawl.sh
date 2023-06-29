#!/bin/bash
scrapy crawl foo -o ../data/pages.jsonl -L WARNING -s JOBDIR=../data/crawls/foo
