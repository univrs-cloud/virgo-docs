---
title: Searching files
description: Finding earlier and deleted versions of Nextcloud files across every restore point, and downloading them.
sidebar:
  order: 6
---

Search looks through every restore point at once, for earlier and deleted versions of the files people keep in Nextcloud: everyone's own files, what is in their trash, and the group folders.

It is the place to start when you know what the file is called, or part of it, but not when it changed or went missing. The node catalogues the files by itself, every hour at ten past, so a file shows up in the search after the next run.

## Searching

Type part of a file's name, or of a folder it is in, into **Search in snapshots** and press Enter.

![Searching Nextcloud's snapshots for "budget"](../../../../../../assets/management/app-snapshots-search.png)

The results are shown as a tree of the folders they are in. A file that no longer exists is marked **Deleted**. Under each file are the restore points that hold a version of it, with what happened to it there, such as **added**, **modified** or **last seen**, and its size. Select a restore point to show it on the timeline. A restore point that the node has since removed is shown without a link, and its version can no longer be downloaded.

Narrow the search down with **Type** for files or folders only, **State** for files that still exist, were changed, renamed or moved, never changed or deleted, **Modified** for when the file was last changed, and **Size**. When there are more results, **Load more** shows the next ones. **Clear** empties the search, its filters and the results.

## Opening a result in Browse files

Each version has a **Browse files** button in front of its other buttons. It opens that restore point at the folder the file was in, with the file already ticked.

Use it when one file is only the start: the search found the contract that was deleted, and now you want to see what else was in that folder on that day. From there you can add more files, [download them together](/management/resources/apps/snapshots/browse/#downloading-the-selection) or [restore them](/management/resources/apps/snapshots/restore/#restoring-a-selection).

A folder in the results has the button too, and opens as it was at that date. Versions in someone's trash or in a group folder cannot be opened this way.

## Downloading files and folders

Each version of a file has a download button next to it, which saves the file to your computer as it was at that restore point. A deleted file is downloaded from one of the versions listed under it.

A folder is downloaded as a `.zip` archive. A folder that matches the search has a download button next to each of its versions, like a file. The folders that make up the tree have one next to their name, which opens **Download as of** with the restore points to choose from.

![Downloading the Documents folder as it was at a restore point](../../../../../../assets/management/app-snapshots-download.png)

The archive holds the whole folder as it was at that restore point, not only the files in the results, so a folder near the top of the tree can be a large download.

Downloads are not available when you manage the node [through your fleet](/management/authentication/#through-your-fleet). Open the node at its own address instead.

To put a version back into Nextcloud instead, see [restoring a file](/management/resources/apps/snapshots/restore/#restoring-one-file).
