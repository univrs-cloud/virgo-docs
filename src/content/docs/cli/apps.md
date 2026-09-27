---
title: "virgo apps"
description: "Installable applications"
sidebar:
  order: 3
---

## virgo apps list

List installed applications

```sh
virgo apps list [options]
```

| Option | Required | Description |
| --- | --- | --- |
| `--json` | No | Output as JSON |

## virgo apps explore

List apps you can still install (skips ones that are already installed)

```sh
virgo apps explore [options]
```

| Option | Required | Description |
| --- | --- | --- |
| `--json` | No | Output as JSON |

## virgo apps install

Install an app from a template. Every variable defined for that template must be set via --env or --env-json (empty values: --env KEY=).

```sh
virgo apps install [options] <name>
```

| Option | Required | Description |
| --- | --- | --- |
| `--env-json <json>` | No | Environment variables as a JSON object, e.g. {"DOMAIN":"node.cluster.example.com","CERTRESOLVER":"le"} |
| `--env <pair>` | No | Environment variable as KEY=value (repeatable) (default: []) |
| `--force` | No | Reinstall an app that is already installed: its project files are rewritten and the stack brought back up, its stored data is kept |
