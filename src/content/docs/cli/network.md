---
title: "virgo network"
description: "Network settings"
sidebar:
  order: 1
---

## virgo network identifier update

Set hostname and DNS search domain

```sh
virgo network identifier update [options]
```

| Option | Required | Description |
| --- | --- | --- |
| `--hostname <name>` | Yes | Short hostname |
| `--cluster <name>` | Yes | Cluster name, the label between the hostname and the domain |
| `--domain <name>` | Yes | Domain, without the cluster |

## virgo network interface update

Configure IPv4 (DHCP or static address)

```sh
virgo network interface update [options]
```

| Option | Required | Description |
| --- | --- | --- |
| `--method <mode>` | Yes | DHCP (auto) or static IP (manual) (choices: "auto", "manual") |
| `--address <ip>` | No | IPv4 address (required with --method manual) |
| `--prefix <n>` | No | CIDR prefix length (required with --method manual) |
| `--gateway <ip>` | No | Default gateway (required with --method manual) |
| `--dns <ip>` | No | DNS server address, repeatable up to 3 times (default: []) |
| `--virtual-ip <ip>` | No | Virtual IP carried by this node (empty string removes it) |

## virgo network virtual-ip take-over

Take over the virtual IP from the node holding it

```sh
virgo network virtual-ip take-over [options]
```

## virgo network virtual-ip release

Give up the virtual IP held by this node

```sh
virgo network virtual-ip release [options]
```
