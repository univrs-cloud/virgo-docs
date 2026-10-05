---
title: Snapshots
description: An app's restore points, and the ways to look inside them and get files back.
sidebar:
  label: Restore points
  order: 4
---

A snapshot is a read-only copy of an app's data as it was at one moment. The node takes them by itself and removes old ones, following the pool's [snapshot schedule](/management/system/storage/#usage). A snapshot only takes up space for what has changed since it was taken, so keeping many of them costs little.

Open an app's details and select **Snapshots**.

![Nextcloud's snapshots](../../../../../../assets/management/app-snapshots.png)

## Restore points

Snapshots taken at the same moment by different schedules, such as the daily and the monthly one at midnight on the first of the month, are shown together as one restore point.

The selected restore point shows when it was taken and the schedules that keep it: **Frequently**, **Hourly**, **Daily**, **Monthly** or **Yearly**.

### Timeline

The timeline runs from **Now** on the left to the oldest restore point on the right. Each schedule gets an equal stretch of it, so the many recent restore points are spread out and the few old ones fit in too. The marks under it show how far back each stretch reaches.

Each dot is a restore point. The bigger the dot, the more space it takes up, which is the data that only this restore point still holds. A hollow dot holds nothing that the others do not. Hover over a dot to see its details.

To choose a restore point, select its dot, drag the slider, or use **Newer** and **Older**. With the slider selected, the arrow keys step from one restore point to the next.

On a narrow screen, the timeline becomes a set of orbits around the app's icon, one per schedule, going round clockwise from **Now**.

## Getting files back

Nextcloud's restore points can be opened, to get back the files people keep in it. Which way in is quickest depends on what you know:

| You know | Start here |
| --- | --- |
| Roughly when things were still right | [Browse files](/management/resources/apps/snapshots/browse/) of that restore point, see what changed since, and pick what you need |
| The name of the file, but not when it went missing | [Search](/management/resources/apps/snapshots/search/) every restore point at once |
| Which version you want | [Restore](/management/resources/apps/snapshots/restore/) it into Nextcloud, or download it to your computer |

The two meet in the middle: every search result can be opened in **Browse files**, at its folder and its date.

The node catalogues the files in Nextcloud's snapshots by itself, every hour at ten past. Searching, and what **Browse files** says about changes, both rely on that catalogue, so the newest changes show up after its next run.

Other apps have restore points and a timeline, but their files cannot be browsed, searched or restored from here.
