---
title: Snapshots
description: An app's restore points, and finding and downloading earlier and deleted files from them.
sidebar:
  order: 4
---

A snapshot is a read-only copy of an app's data as it was at one moment. The node takes them by itself and removes old ones, following the pool's [snapshot schedule](/management/system/storage/#usage). A snapshot only takes up space for what has changed since it was taken, so keeping many of them costs little.

Open an app's details and select **Snapshots**.

![Nextcloud's snapshots](../../../../../assets/management/app-snapshots.png)

## Restore points

Snapshots taken at the same moment by different schedules, such as the daily and the monthly one at midnight on the first of the month, are shown together as one restore point.

The selected restore point shows when it was taken and the schedules that keep it: **Frequently**, **Hourly**, **Daily**, **Monthly** or **Yearly**.

### Timeline

The timeline runs from **Now** on the left to the oldest restore point on the right. Each schedule gets an equal stretch of it, so the many recent restore points are spread out and the few old ones fit in too. The marks under it show how far back each stretch reaches.

Each dot is a restore point. The bigger the dot, the more space it takes up, which is the data that only this restore point still holds. A hollow dot holds nothing that the others do not. Hover over a dot to see its details.

To choose a restore point, select its dot, drag the slider, or use **Newer** and **Older**. With the slider selected, the arrow keys step from one restore point to the next.

On a narrow screen, the timeline becomes a set of orbits around the app's icon, one per schedule, going round clockwise from **Now**.

### Browsing and rolling back

**Browse files** and **Roll back** are coming soon. Until then, [search the snapshots](#searching-files) for the file you need and [download it](#downloading-files-and-folders).

## Searching files

When the app's **Indexer** is on, its snapshots are added to the [indexer](/management/dashboard/#indexer)'s catalogue of files, and you can search it for earlier and deleted versions of the app's files. Turn it on with the **Indexer** switch next to the search, below the timeline. The indexer catalogues new snapshots every hour, so files show up in the search after its next run.

Type part of a file's name, or of a folder it is in, into **Search in snapshots** and press Enter.

![Searching Nextcloud's snapshots for "budget"](../../../../../assets/management/app-snapshots-search.png)

The results are shown as a tree of the folders they are in. A file that no longer exists is marked **Deleted**. Under each file are the restore points that hold a version of it, with what happened to it there, such as **added**, **modified** or **last seen**, and its size. Select a restore point to show it on the timeline. A restore point that the node has since removed is shown without a link, and its version can no longer be downloaded.

Narrow the search down with **Type** for files or folders only, **State** for files that still exist, were changed, renamed or moved, never changed or deleted, **Modified** for when the file was last changed, and **Size**. When there are more results, **Load more** shows the next ones. **Clear** empties the search, its filters and the results.

### Downloading files and folders

Each version of a file has a download button next to it, which saves the file to your computer as it was at that restore point. A deleted file is downloaded from one of the versions listed under it.

A folder is downloaded as a `.zip` archive. A folder that matches the search has a download button next to each of its versions, like a file. The folders that make up the tree have one next to their name, which opens **Download as of** with the restore points to choose from.

![Downloading the Documents folder as it was at a restore point](../../../../../assets/management/app-snapshots-download.png)

The archive holds the whole folder as it was at that restore point, not only the files in the results, so a folder near the top of the tree can be a large download.

Downloads are not available when you manage the node [through your fleet](/management/authentication/#through-your-fleet). Open the node at its own address instead.

## Recovering files

To recover a file, [download it](#downloading-files-and-folders) from the search results and put it back where it belongs. Recovering it in place from **Snapshots** is coming soon.

To copy the file back on the node itself instead, find it with the [`virgo indexer`](/cli/indexer/) commands on the node:

```sh
virgo indexer search report.pdf
```

Each result shows where the file is now, or, if it was deleted, the path to recover it from inside the snapshot that still holds it. Copy the file back from there. `virgo indexer history` lists every version of a file, and `virgo indexer deleted` the files that were deleted.
