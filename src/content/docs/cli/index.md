---
title: "CLI reference"
description: "Reference for the virgo command line tool."
sidebar:
  label: "Overview"
  order: 0
---

Every Virgo node ships with the `virgo` command. This reference matches version 2.19.21.

```sh
virgo [options] [command]
```

Add `--help` to any command to print its usage in the terminal.

## Commands

| Command | Description |
| --- | --- |
| [`virgo indexer`](/cli/indexer/) | Index and search files in ZFS snapshots |
| [`virgo network`](/cli/network/) | Network settings |
| [`virgo apps`](/cli/apps/) | Installable applications |

## Global options

| Option | Required | Description |
| --- | --- | --- |
| `-V, --version` | No | output the version number |
