---
title: "virgo indexer"
description: "Index and search files in ZFS snapshots"
sidebar:
  order: 3
---

## virgo indexer index

Index ZFS datasets and snapshots (uses configured indexer paths)

```sh
virgo indexer index [options]
```

## virgo indexer reindex

Clear indexed data and force a full re-crawl on next run

```sh
virgo indexer reindex [options]
```

| Option | Required | Description |
| --- | --- | --- |
| `--dataset <names>` | No | Dataset root(s), comma-separated; reset each root and its children |

## virgo indexer search

Search files by path (glob with * ? or keywords)

```sh
virgo indexer search [options] <term>
```

| Option | Required | Description |
| --- | --- | --- |
| `--dataset <names>` | No | Limit to dataset root(s), comma-separated (each matches that dataset and children) |
| `--path <pattern>` | No | Filter by path (prefix or glob with * ?) |
| `--type <type>` | No | Filter by type: file, dir, link |
| `--min-size <bytes>` | No | Minimum file size in bytes |
| `--max-size <bytes>` | No | Maximum file size in bytes |
| `--since <date>` | No | Files modified after this date (ISO 8601) |
| `--until <date>` | No | Files modified before this date (ISO 8601) |
| `--limit <n>` | No | Max results (default 100) |
| `--offset <n>` | No | Skip first N results |
| `--json` | No | Output as JSON |

## virgo indexer history

Full version history of a file

```sh
virgo indexer history [options] <path>
```

| Option | Required | Description |
| --- | --- | --- |
| `--dataset <names>` | No | Limit to dataset root(s), comma-separated (each matches that dataset and children) |
| `--json` | No | Output as JSON |

## virgo indexer deleted

List deleted files

```sh
virgo indexer deleted [options]
```

| Option | Required | Description |
| --- | --- | --- |
| `--dataset <names>` | No | Limit to dataset root(s), comma-separated (each matches that dataset and children) |
| `--path <pattern>` | No | Filter by path (prefix or glob with * ?) |
| `--limit <n>` | No | Max results (default 2000) |
| `--offset <n>` | No | Skip first N results |
| `--json` | No | Output as JSON |

## virgo indexer changes

Show all changes in a snapshot

```sh
virgo indexer changes [options] <snapshot>
```

| Option | Required | Description |
| --- | --- | --- |
| `--dataset <names>` | No | Resolve snapshot within these dataset root(s), comma-separated |
| `--path <pattern>` | No | Filter by path (prefix or glob with * ?); matches old or new path |
| `--limit <n>` | No | Max results (default 5000) |
| `--offset <n>` | No | Skip first N results |
| `--json` | No | Output as JSON |

## virgo indexer diff

Changes between two snapshots

```sh
virgo indexer diff [options] <snapA> <snapB>
```

| Option | Required | Description |
| --- | --- | --- |
| `--limit <n>` | No | Max results (default 5000) |
| `--offset <n>` | No | Skip first N results |
| `--json` | No | Output as JSON |

## virgo indexer stats

Index statistics

```sh
virgo indexer stats [options]
```

| Option | Required | Description |
| --- | --- | --- |
| `--json` | No | Output as JSON |
