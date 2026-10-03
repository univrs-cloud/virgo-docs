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

**Browse files** and **Roll back** are coming soon. Until then, [search the snapshots](#searching-files) for the file you need, and [download](#downloading-files-and-folders) or [restore](#restoring-files) it.

## Searching files

Nextcloud's snapshots can be searched for earlier and deleted versions of the files people keep in it: everyone's own files, what is in their trash, and the group folders. The node catalogues the files in those snapshots by itself, every hour at ten past, so files show up in the search after its next run. Other apps have no search.

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

## Restoring files

Each version of a file has a restore button next to its download button. It puts that version back into a Nextcloud folder, where it shows up in Nextcloud by itself. A folder cannot be restored. [Download it](#downloading-files-and-folders) instead.

Select the restore button to open **Restore file**, then choose where the file goes:

1. **Restore to** lists every Nextcloud user. Open a user to see their folders, and open a folder to see the folders inside it.
2. Select the folder the file should go to, or [add a new one](#restoring-to-a-new-folder). The folder the file was in at that restore point is already selected. A file from someone's trash has no folder selected, and gets its original name back.
3. Select **Restore**.

![Restoring Budget 2026.xlsx to the folder it was in](../../../../../assets/management/app-snapshots-restore.png)

What happens next depends on what is in that folder.

### The folder has no file with that name

The file is restored straight away. This is the usual case for a file that was deleted.

### The folder already has a file with that name

Nothing is restored yet. **File already exists** shows the two files side by side, the one in the folder now and the one from the restore point, each with its size and when it was last changed.

![Choosing what to do with a file that is already there](../../../../../assets/management/app-snapshots-restore-conflict.png)

Choose what to do:

- **Restore as a copy** keeps the file that is there and puts the restored one next to it, with the restore point's date in its name, such as `Budget 2026 (restored 1 Aug 2026).xlsx`. Nothing is lost.
- **Overwrite** replaces the file that is there with the restored one. The file that was there is gone, unless an earlier restore point still holds it.
- **Cancel** restores nothing and returns to **Restore file**, where you can choose another folder.

In both cases, a notification shows the file being restored and where it ended up.

### Restoring to a new folder

The file can also go to a folder that does not exist yet:

1. Select the new folder button at the end of the folder the new one should be in.
2. Type a name and select **Add**, or press Enter.

![Naming a new folder inside Documents](../../../../../assets/management/app-snapshots-restore-folder-name.png)

The new folder is marked **New** and is selected already. It can hold more new folders, and the remove button next to it takes it out again, with anything added inside it. Folders that already exist cannot be removed here.

![The new folder, selected as the place to restore to](../../../../../assets/management/app-snapshots-restore-folder-new.png)

A new folder only exists in **Restore file** until you select **Restore**. Only then is it created, and only where the file is actually placed: the folders that lead to the file. Any other folders you added along the way are never created, and closing **Restore file** without restoring creates nothing.

When the folder the file was in no longer exists, it is added as a new folder and selected already, so restoring puts the file back where it was.

To copy a file back on the node itself, find it with the [`virgo indexer`](/cli/indexer/) commands on the node:

```sh
virgo indexer search report.pdf
```

Each result shows where the file is now, or, if it was deleted, the path to recover it from inside the snapshot that still holds it. Copy the file back from there. `virgo indexer history` lists every version of a file, and `virgo indexer deleted` the files that were deleted.
