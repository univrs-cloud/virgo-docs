---
title: Setup
description: Set up a new virgoOS node, from the licence agreement to the first sign-in.
sidebar:
  label: Overview
  order: 0
---

Setup runs the first time a virgoOS node starts. It sets the network, creates the storage pool, registers the node with your fleet, installs the core apps and replaces the factory password. When it finishes, the node is managed from its dashboard.

## Before you start

- Connect the node to your network with a cable and power it on.
- Open the node's IP address in a browser. The node uses its own certificate until setup is done, so your browser shows a security warning. Accept it to continue.
- Have your fleet account ready, or create one at [fleet.univrs.cloud](https://fleet.univrs.cloud). It is mandatory if the node will use the `univrs.cloud` domain, and optional with your own domain.
- Make sure you have access to your router. You will need to forward a few ports to the node.

Setup shows its progress, and any errors, as notifications. If a step fails, you stay on that step and can try again.

## Steps

1. [Licence agreement](/setup/licence/)
2. [Network interface](/setup/interface/)
3. [Network host](/setup/host/)
4. [Port forwarding](/setup/ports/)
5. [Storage](/setup/storage/)
6. [Fleet](/setup/fleet/)
7. [Core apps](/setup/apps/)
8. [Password](/setup/password/)
9. [Finish](/setup/finish/)
