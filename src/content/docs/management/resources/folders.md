---
title: Folders
description: Shared folders on the node, for the computers on your local network.
sidebar:
  order: 6
---

**Folders** are shared folders on the node that the computers on your local network can open, whether they run Windows, macOS or Linux. Users reach them with their node username and password, unless the folder is open to everyone on the network.

![The Folders page](../../../../assets/management/folders.png)

For each folder, the list shows its name and path, how many computers have it open right now, the users who can reach it, how much data it receives and sends per second, its capacity and how much of it is used. Hover over the number of computers to see who is connected and from which address. The clock icon next to a name shows the state of the folder's [snapshots](#history); hover over it for details. Sort the list by name, traffic, capacity or usage with the arrows in the column headers, and use **Search** to find a folder by its name, path or users.

![Who has a folder open](../../../../assets/management/folders-clients.png)

## Opening a folder

Select the Windows, Apple or Linux icon next to a folder to copy its address for that system:

- **Windows:** `\\192.168.1.10\documents`, to paste in File Explorer's address bar.
- **macOS:** `smb://192.168.1.10/documents`, to paste in Finder after pressing **⌘K**.
- **Linux:** `smb://192.168.1.10/documents`, to paste in your file manager's address bar.

The address is the [virtual IP](/setup/interface/), the address the node shares with its cluster.

![Copying a folder's address](../../../../assets/management/folders-address.png)

When asked, enter your node username and password. A folder marked **Guest** has open access: anyone on your local network can open it and change its files, without a username or password.

On a Mac, the node also appears in Finder's sidebar under **Network**, by the name of its cluster, for example **virgo**. Select it and log in to see the folders you can reach.

The computer reaches the node over your local network only, so folders open while it is on the same network as the node.

Locking a user stops them from reaching every folder, until they are unlocked.

## Scanning to a folder

A folder is also a good place for a scanner or multifunction printer to save its scans. A device that can scan to a network folder (often called scan to folder or scan to SMB) saves each scan straight to the node, where everyone who can reach the folder finds it.

Give each device a [user](/management/system/users/) of its own, then use the folder's **Authorized users** to decide two things at once: which devices can save scans there, and which people can open them. A folder for the accounting office, for example, lists that office's scanner and the people who work there, and nobody else.

In the device's settings, enter the node's address and the folder's name, as they appear in the folder's address, together with the device's own username and password. If a device is replaced or lost, locking or deleting its user cuts its access without touching anyone else's.

This works with Nextcloud too. [Share an existing path](#sharing-an-existing-path), such as a Nextcloud group folder or a user's files, and authorize the device on it: the scans land in Nextcloud, where the same people find them from their browser or phone.

## Adding a folder

Select **New folder**, then enter:

- **Path:** keep **New share** to create an empty folder, or choose an existing path to share what is already there.
- **Name:** what the folder is called.
- **Authorized users:** the users who can reach it. Leave them all unchecked for **Guest**, open access for anyone on your local network.
- **Capacity:** how much space the folder can take up, in GiB. Only for a new share.
- **Take snapshots:** keep a [history](#history) of the folder's files. Only for a new share.

![Adding a folder](../../../../assets/management/folder-create.png)

### Sharing an existing path

The existing paths are places on the node that already hold files, such as a Nextcloud user's files or a Nextcloud group folder. Sharing one lets you open those files from your computers too.

![Sharing a Nextcloud user's files](../../../../assets/management/folder-create-existing.png)

Such a folder has no capacity of its own. It shares the space of the place it lives in, which is the capacity the list shows, while its usage counts only its own files.

## Folder details

Select a folder in the list to see it in detail.

![A folder in detail](../../../../assets/management/folder-details.png)

- **Usage:** the folder's capacity, how much of it is used and how much is free. **Space saved** shows how much space compression saves. For a folder with snapshots, the bar splits the used space into the folder's **Data** and its **Snapshots**.
- **Authorized users:** the users who can reach the folder, each with the icons that copy the folder's address for Windows, Apple or Linux. The Apple and Linux addresses include the user's name.
- **Clients:** the computers that have the folder open right now, with the user, the computer's address and how much data the folder receives from it and sends to it per second.

The **Snapshots** tab shows the state of the folder's [snapshots](#history) and how many it has. Select the arrow in the top left corner to go back to the list.

## Editing or deleting a folder

Open a folder's menu in the list:

![A folder's menu](../../../../assets/management/folders-menu.png)

- **Edit:** change the authorized users, or the capacity of a new share. The name and path stay the same.
- **Delete:** permanently delete the folder and every file in it.
- **Remove:** for a folder on an existing path, stop sharing it. Its files stay where they are.

In a folder's details, the pen edits the folder and the menu next to it deletes or removes it.

![Editing a folder](../../../../assets/management/folder-edit.png)

While a change is being applied, a spinning gear takes the place of the menu.

## History

A new share is part of the pool's [snapshots](/management/system/storage/#usage), its automatic history of your files, unless **Take snapshots** was cleared when it was added. The clock icon next to its name is green while snapshots are enabled, orange while they are paused and grey when they are disabled.

To change that, open the folder's menu and choose under **Snapshots**:

- **Pause:** stop taking new snapshots. The ones already taken are kept.
- **Disable:** stop taking snapshots and delete the ones already taken, after you confirm.
- **Resume** or **Enable:** take snapshots again.

The same choices are buttons on the **Snapshots** tab of the folder's details.

![A folder's snapshots](../../../../assets/management/folder-snapshots.png)

:::caution
Disabling snapshots permanently deletes every snapshot of the folder. Without them, files that are deleted, overwritten or encrypted by mistake cannot be recovered. To keep the existing snapshots, pause them instead.
:::

A folder on an existing path has no snapshots of its own. Its history is that of the place it lives in.

## On the Dashboard

The **Dashboard** lists the folders too, with a bar showing how full each one is.

![Folders on the Dashboard](../../../../assets/management/folders-dashboard.png)
