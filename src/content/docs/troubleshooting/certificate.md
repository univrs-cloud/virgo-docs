---
title: No certificate on univrs.cloud
description: The node's name resolves, but its certificate is never issued.
sidebar:
  order: 1
---

## What you see

- Setup stops at [Core apps](/setup/apps/#not-ready-after-a-minute) with **The name resolves but no certificate was issued.**
- Browsers keep warning about the node's certificate.
- Traefik's log repeats `time limit exceeded` together with `did not return the expected TXT record`.

## Why it happens

On `univrs.cloud` the fleet publishes a DNS record that proves to Let's Encrypt that the name is yours. Before it asks Let's Encrypt, the node checks for itself that the record is in place, by asking the domain's name servers on the internet.

A router that filters or redirects DNS requests answers in their place. The node never sees the record and gives up after a minute, and every later attempt ends the same way. Nothing is wrong with the node or with your fleet account.

This kind of filtering rarely appears among the firewall rules. It is usually part of a content filtering or ad blocking feature that is applied to the whole network, such as UniFi's Content Filter.

## Check

Run this on the node:

```sh
dig univrs.cloud SOA @192.0.2.1
```

No server exists at `192.0.2.1`, so the request should time out. If it gets an answer, something on your network is intercepting DNS.

## Fix

Exclude every node from the filtering, or apply the filtering only to the devices that need it. Run the check again. Once it times out, the certificate can be issued.

The node can keep using a DNS server on your network, Pi-hole included. It only has to be able to reach other DNS servers when it asks them directly.
