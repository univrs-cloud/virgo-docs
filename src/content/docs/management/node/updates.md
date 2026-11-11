---
title: Updates
description: Keeping virgoOS up to date, from the Updates page.
sidebar:
  order: 16
---

**Updates** shows whether new versions of virgoOS are available and installs them.

## Up to date

The node checks for updates every day at midnight. When there is nothing to install, the page says **Up to date**.

![Up to date](../../../../assets/management/updates-none.png)

Select **Check for new updates** to check right away instead of waiting for the daily check.

![Checking for updates](../../../../assets/management/updates-checking.png)

## When updates are available

When updates are available, **Updates** in the menu shows how many there are, so you see it from any page.

![Updates in the menu, with 4 updates available](../../../../assets/management/updates-menu.png)

The Updates page lists each update with the version installed now and the version it updates to.

![4 updates available](../../../../assets/management/updates-available.png)

Select an update to read its changelog, the list of changes since the version installed now. **Show changelogs** opens every changelog at once.

Select **Install** to install all of them. **Install** is not available while the node is checking for updates or while an app is being updated.

## While an update runs

The update shows each step as it happens, with the progress of the download and then of the installation. The node's other pages stay closed until the update is finished and you continue.

![An update in progress](../../../../assets/management/update-progress.png)

Everyone else who opens the node in the meantime, including users without the administrator role, sees that it is under maintenance and will be back on its own.

![The node under maintenance](../../../../assets/management/update-maintenance.png)

## When it finishes

When the update succeeds, select **Continue** to go back to the **Dashboard**.

![Update succeeded](../../../../assets/management/update-finished.png)

If the update needs a restart to take effect, **Reboot now** and **Later** appear instead of **Continue**. **Reboot now** restarts the node right away. **Later** goes back to the **Dashboard**, and until the node restarts, a notification with its own **Reboot now** reminds you each time you open the node.

## If the update fails

If something goes wrong, for example a package fails to set up, the page says the update could not be completed and shows the steps up to the error. Select **Continue** to go back to the **Dashboard**, then install the updates again later.

![An update that failed](../../../../assets/management/update-failed.png)
