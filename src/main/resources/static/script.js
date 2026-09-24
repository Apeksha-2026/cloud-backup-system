/* =========================================================
   CLOUD BACKUP SYSTEM
   PHASE 2 - FRONTEND

   Current version:
   - Frontend UI
   - Manual backup simulation
   - Automatic backup settings
   - Dashboard statistics
   - Backup history
   - Local browser storage

   Later:
   - POST /api/backup
   - GET /api/backups
   - Backend automatic scheduler
   - Cloud storage
========================================================= */

/* =========================================================
   DATA
========================================================= */

let selectedFiles = [];
let selectedSelectionType = null;

const STORAGE_LIMIT_BYTES = 5 * 1024 * 1024 * 1024;

let backups = JSON.parse(localStorage.getItem("backupHistory")) || [];

let automaticSettings = JSON.parse(
  localStorage.getItem("automaticSettings"),
) || {
  enabled: false,
  folderPath: "",
  frequencyMinutes: 60,
  backupModifiedFiles: true,
  includeSubfolders: true,
};

/* =========================================================
   ELEMENTS
========================================================= */

const navButtons = document.querySelectorAll(".nav-button");

const sections = document.querySelectorAll(".page-section");

const pageTitle = document.getElementById("pageTitle");

const pageSubtitle = document.getElementById("pageSubtitle");

/* =========================================================
   NAVIGATION
========================================================= */

const pageInformation = {
  dashboard: {
    title: "Dashboard",
    subtitle: "Manage your cloud backups and restore files when required.",
  },

  backup: {
    title: "Backup",
    subtitle: "Back up important files manually or automatically.",
  },

  restore: {
    title: "Restore",
    subtitle: "Restore your backed-up files when required.",
  },

  history: {
    title: "Backup History",
    subtitle: "View and manage previous cloud backups.",
  },

  settings: {
    title: "Settings",
    subtitle: "Configure automatic backup and system preferences.",
  },
};

navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const sectionName = button.dataset.section;

    openSection(sectionName);

    if (sectionName === "history") {
      loadAutomaticBackupHistory();
    }
  });
});

function openSection(sectionName) {
  sections.forEach((section) => {
    section.classList.remove("active-section");
  });

  navButtons.forEach((button) => {
    button.classList.remove("active");
  });

  const selectedSection = document.getElementById(sectionName);

  if (selectedSection) {
    selectedSection.classList.add("active-section");
  }

  const selectedButton = document.querySelector(
    `.nav-button[data-section="${sectionName}"]`,
  );

  if (selectedButton) {
    selectedButton.classList.add("active");
  }

  if (pageInformation[sectionName]) {
    pageTitle.textContent = pageInformation[sectionName].title;

    pageSubtitle.textContent = pageInformation[sectionName].subtitle;
  }
  if (sectionName === "history") {
    loadAutomaticBackupHistory();
  }
}

/* =========================================================
   MANUAL FILE SELECTION
========================================================= */

/* =========================================================
   FILE / FOLDER SELECTION
========================================================= */

const fileInput = document.getElementById("fileInput");

const folderInput = document.getElementById("folderInput");

const selectedItem = document.getElementById("selectedItem");

const manualBackupButton = document.getElementById("manualBackupButton");

function selectFile() {
  fileInput.click();
}

function selectFolder() {
  folderInput.click();
}

/* -------------------------
   Single file selected
------------------------- */

fileInput.addEventListener("change", function () {
  if (!fileInput.files.length) {
    return;
  }

  const file = fileInput.files[0];

  // Clear folder selection
  folderInput.value = "";

  selectedFiles = [file];
  selectedSelectionType = "Manual";

  selectedItem.textContent = `Selected file: ${file.name} (${formatFileSize(file.size)})`;
});

/* -------------------------
   Folder selected
------------------------- */

folderInput.addEventListener("change", function () {
  if (!folderInput.files.length) {
    return;
  }

  // Store ALL files
  selectedFiles = Array.from(folderInput.files);

  selectedSelectionType = "Manual";

  const fileCount = selectedFiles.length;

  const firstFile = selectedFiles[0];

  /*
           webkitRelativePath looks like:

           static/index.html

           So we can get:

           static
        */

  let folderName = "Selected folder";

  if (firstFile.webkitRelativePath) {
    folderName = firstFile.webkitRelativePath.split("/")[0];
  }

  selectedItem.textContent = `Selected folder: ${folderName} (${fileCount} file(s))`;
});

/* =========================================================
   MANUAL BACKUP
========================================================= */

manualBackupButton.addEventListener("click", async function () {
  console.log("START BACKUP BUTTON CLICKED");

  // Make sure something was selected
  if (selectedFiles.length === 0) {
    showToast("Please select a file or folder first.");

    return;
  }

  // Create the request data
  const formData = new FormData();

  // Add ALL selected files
  selectedFiles.forEach((file) => {
    formData.append("files", file);
  });

  // Prevent multiple clicks
  manualBackupButton.disabled = true;

  manualBackupButton.textContent = "Backing up...";

  try {
    // Send files to Spring Boot
    const response = await fetch("/api/backup", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    // Check backend response
    if (!response.ok || !result.success) {
      throw new Error(result.message || "Backup failed.");
    }

    /*
     * Backend successfully stored the files.
     *
     * Only now do we update the frontend
     * backup history.
     */

    selectedFiles.forEach((file) => {
      const newBackup = {
        id: Date.now() + Math.random(),

        name: file.name,

        relativePath: file.webkitRelativePath || file.name,

        size: formatFileSize(file.size),

        sizeBytes: file.size,

        date: getCurrentDateTime(),

        type: "Manual",

        status: "Backed Up",
      };

      backups.unshift(newBackup);
    });

    // Save and refresh UI
    saveBackupHistory();

    renderBackupHistory();

    updateDashboard();

    showToast(result.message);

    // Clear selection
    selectedFiles = [];

    fileInput.value = "";

    folderInput.value = "";

    selectedItem.textContent = "Nothing selected";
  } catch (error) {
    console.error("Backup error:", error);

    showToast(error.message || "Unable to backup files.");
  } finally {
    manualBackupButton.disabled = false;

    manualBackupButton.textContent = "☁ Start Backup";
  }
});

/* =========================================================
   BACKUP MODE TABS
========================================================= */

function switchBackupMode(mode) {
  const manual = document.getElementById("manualBackup");

  const automatic = document.getElementById("automaticBackup");

  const tabs = document.querySelectorAll(".backup-tab");

  tabs.forEach((tab) => {
    tab.classList.remove("active");
  });

  if (mode === "manual") {
    manual.classList.add("active-mode");

    automatic.classList.remove("active-mode");

    tabs[0].classList.add("active");
  } else {
    automatic.classList.add("active-mode");

    manual.classList.remove("active-mode");

    tabs[1].classList.add("active");

    loadAutomaticSettings();
  }
}

/* =========================================================
   AUTOMATIC BACKUP
========================================================= */

const backupToggle = document.getElementById("backupToggle");

const backupFolder = document.getElementById("backupFolder");

const backupFrequency = document.getElementById("backupFrequency");

const modifiedFiles = document.getElementById("modifiedFiles");

const subfolders = document.getElementById("subfolders");

function loadAutomaticSettings() {
  backupToggle.checked = automaticSettings.enabled;

  backupFolder.value = automaticSettings.folderPath || "";

  backupFrequency.value = automaticSettings.frequencyMinutes || 60;

  modifiedFiles.checked = automaticSettings.backupModifiedFiles;

  subfolders.checked = automaticSettings.includeSubfolders;
}

function chooseSettingsFolder() {
  const picker = document.getElementById("settingsFolderPicker");

  picker.click();
}

function chooseAutomaticFolder() {
  const picker = document.getElementById("automaticFolderPicker");

  picker.click();
}

/* -------------------------
   Settings folder selected
------------------------- */

document
  .getElementById("settingsFolderPicker")
  .addEventListener("change", function () {
    if (!this.files.length) {
      return;
    }

    const firstFile = this.files[0];

    let folderName = "Selected folder";

    if (firstFile.webkitRelativePath) {
      folderName = firstFile.webkitRelativePath.split("/")[0];
    }

    document.getElementById("settingsFolder").value = folderName;

    showToast(`Folder selected: ${folderName}`);
  });

/* -------------------------
   Automatic Backup folder
------------------------- */

document
  .getElementById("automaticFolderPicker")
  .addEventListener("change", function () {
    if (!this.files.length) {
      return;
    }

    const firstFile = this.files[0];

    let folderName = "Selected folder";

    if (firstFile.webkitRelativePath) {
      folderName = firstFile.webkitRelativePath.split("/")[0];
    }

    document.getElementById("backupFolder").value = folderName;

    showToast(`Folder selected: ${folderName}`);
  });

async function saveAutomaticSettings() {
  const settings = {
    enabled: backupToggle.checked,

    folderPath: backupFolder.value.trim(),

    frequencyMinutes: Number(backupFrequency.value),

    backupModifiedFiles: modifiedFiles.checked,

    includeSubfolders: subfolders.checked,
  };

  if (settings.enabled && settings.folderPath === "") {
    showToast("Please enter the full folder path.");

    return;
  }

  try {
    const response = await fetch("/api/settings/automatic-backup", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(settings),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || "Unable to save automatic backup settings.",
      );
    }

    automaticSettings = result;

    localStorage.setItem(
      "automaticSettings",
      JSON.stringify(automaticSettings),
    );

    loadAutomaticSettings();

    updateAutomaticStatus();

    showToast("Automatic backup settings saved successfully.");
  } catch (error) {
    console.error("Automatic backup settings error:", error);

    showToast(error.message || "Unable to save automatic backup settings.");
  }
}

/* =========================================================
   SETTINGS PAGE
========================================================= */

const settingsAutoToggle = document.getElementById("settingsAutoToggle");

const settingsFolder = document.getElementById("settingsFolder");

const settingsFrequency = document.getElementById("settingsFrequency");

const settingsModified = document.getElementById("settingsModified");

const settingsSubfolders = document.getElementById("settingsSubfolders");

function loadSettingsPage() {
  settingsAutoToggle.checked = automaticSettings.enabled;

  settingsFolder.value = automaticSettings.folderPath || "";

  settingsFrequency.value = automaticSettings.frequencyMinutes || 60;

  settingsModified.checked = automaticSettings.backupModifiedFiles;

  settingsSubfolders.checked = automaticSettings.includeSubfolders;
}

async function saveSettingsPage() {
  const settings = {
    enabled: settingsAutoToggle.checked,

    folderPath: settingsFolder.value.trim(),

    frequencyMinutes: Number(settingsFrequency.value),

    backupModifiedFiles: settingsModified.checked,

    includeSubfolders: settingsSubfolders.checked,
  };

  if (settings.enabled && settings.folderPath === "") {
    showToast("Please enter the full folder path.");

    return;
  }

  try {
    const response = await fetch("/api/settings/automatic-backup", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(settings),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Unable to save settings.");
    }

    automaticSettings = result;

    localStorage.setItem(
      "automaticSettings",
      JSON.stringify(automaticSettings),
    );

    loadSettingsPage();

    updateAutomaticStatus();

    showToast("Automatic backup settings saved successfully.");
  } catch (error) {
    console.error("Settings save error:", error);

    showToast(error.message || "Unable to save settings.");
  }
}
/* =========================================================
   AUTOMATIC STATUS
========================================================= */

function updateAutomaticStatus() {
  const badge = document.getElementById("autoStatusBadge");

  const statusText = document.getElementById("autoStatusText");

  const nextBackup = document.getElementById("nextBackup");

  const settingsStatus = document.getElementById("settingsStatus");

  const settingsNextBackup = document.getElementById("settingsNextBackup");

  if (automaticSettings.enabled) {
    badge.textContent = "ON";

    badge.classList.add("active");

    statusText.textContent = "Automatic backup is enabled";

    const frequencyText = getFrequencyText(automaticSettings.frequencyMinutes);

    nextBackup.textContent = frequencyText;

    settingsStatus.textContent = "Active";

    settingsNextBackup.textContent = frequencyText;
  } else {
    badge.textContent = "OFF";

    badge.classList.remove("active");

    statusText.textContent = "Automatic backup is disabled";

    nextBackup.textContent = "Disabled";

    settingsStatus.textContent = "Disabled";

    settingsNextBackup.textContent = "Disabled";
  }
}

/* =========================================================
   LOAD AUTOMATIC BACKUP HISTORY
========================================================= */

async function loadAutomaticBackupHistory() {
  try {
    const response = await fetch("/api/automatic-backup-history", {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Unable to load automatic backup history.");
    }

    const automaticBackups = await response.json();

    automaticBackups.forEach((backup) => {
      const alreadyExists = backups.some(
        (existingBackup) => existingBackup.id === backup.id,
      );

      if (!alreadyExists) {
        backups.unshift(backup);
      }
    });

    saveBackupHistory();

    renderBackupHistory();

    updateDashboard();

    console.log("Automatic backup history loaded:", automaticBackups);
  } catch (error) {
    console.error("Automatic backup history error:", error);
  }
}

/* =========================================================
   BACKUP HISTORY
========================================================= */

function renderBackupHistory(filteredBackups = backups) {
  const table = document.getElementById("backupTable");

  table.innerHTML = "";

  if (filteredBackups.length === 0) {
    table.innerHTML = `
            <tr>
                <td colspan="6">
                    No backups found.
                </td>
            </tr>
        `;

    return;
  }

  filteredBackups.forEach((backup) => {
    const row = document.createElement("tr");

    row.innerHTML = `

                <td>
                    ${escapeHtml(backup.name)}
                </td>

                <td>
                    ${escapeHtml(backup.size)}
                </td>

                <td>
                    ${escapeHtml(backup.date)}
                </td>

                <td>
                    ${escapeHtml(backup.type)}
                </td>

                <td>
                    <span class="history-status">
                        ${escapeHtml(backup.status)}
                    </span>
                </td>

                <td>

               <button
    class="action-button"
    onclick="requestRestore(${backup.id})"
>
    Restore
</button>

<button
    class="remove-button"
    onclick="removeBackup(${backup.id})"
>
    Delete
</button>

                </td>

            `;

    table.appendChild(row);
  });
}

/* =========================================================
   RESTORE PLACEHOLDER
========================================================= */

function requestRestore(id) {
  const backup = backups.find((item) => item.id === id);

  if (!backup) {
    return;
  }

  /*
       Later this will call your friend's backend:

       POST /api/restore/{id}

       We are intentionally NOT implementing
       real restore logic here because Restore
       belongs to your friend's phase.
    */

  showToast(`Restore requested for ${backup.name}.`);
}

/* =========================================================
   SEARCH
========================================================= */

const searchInput = document.getElementById("searchInput");

searchInput.addEventListener("input", function () {
  const search = searchInput.value.toLowerCase().trim();

  const filtered = backups.filter((backup) =>
    backup.name.toLowerCase().includes(search),
  );

  renderBackupHistory(filtered);
});

/* =========================================================
   DASHBOARD
========================================================= */

function updateDashboard() {
  const total = document.getElementById("totalBackups");

  const storage = document.getElementById("storageUsed");

  const files = document.getElementById("filesBackedUp");

  const last = document.getElementById("lastBackup");

  const storageProgress = document.getElementById("storageProgress");

  const storageAvailable = document.getElementById("storageAvailable");

  const storagePercentage = document.getElementById("storagePercentage");

  /* -------------------------
       Total backups
    ------------------------- */

  total.textContent = backups.length;

  /* -------------------------
       Files backed up
       (currently one record = one file)
    ------------------------- */

  files.textContent = backups.length;

  /* -------------------------
       Calculate total storage
    ------------------------- */

  let totalBytes = 0;

  backups.forEach((backup) => {
    totalBytes += parseFileSize(backup.size);
  });

  /* -------------------------
       Display used storage
    ------------------------- */

  storage.textContent = formatFileSize(totalBytes);

  /* -------------------------
       Storage percentage
    ------------------------- */

  const percentage = (totalBytes / STORAGE_LIMIT_BYTES) * 100;

  const safePercentage = Math.min(percentage, 100);

  storageProgress.style.width = safePercentage + "%";

  storagePercentage.textContent =
    percentage < 0.01 ? "0%" : percentage.toFixed(2) + "%";

  /* -------------------------
       Available storage
    ------------------------- */

  const availableBytes = Math.max(STORAGE_LIMIT_BYTES - totalBytes, 0);

  storageAvailable.textContent = formatFileSize(availableBytes) + " available";

  /* -------------------------
       Last backup
    ------------------------- */

  last.textContent = backups.length > 0 ? backups[0].date : "None";

  renderRecentActivity();

  updateAutomaticStatus();
}

/*==============================Add the Remove function==================================*/

function removeBackup(id) {
  const backup = backups.find((item) => item.id === id);

  if (!backup) {
    return;
  }

  const confirmed = confirm(`Remove "${backup.name}" from your backups?`);

  if (!confirmed) {
    return;
  }

  backups = backups.filter((item) => item.id !== id);

  saveBackupHistory();

  renderBackupHistory();

  updateDashboard();

  showToast(`${backup.name} was removed from your backups.`);

  /*
       Later, Phase 3 will replace this frontend
       operation with:

       DELETE /api/backup/{id}

       so the actual cloud file is also removed.
    */
}

/* =========================================================
   RECENT ACTIVITY
========================================================= */

function renderRecentActivity() {
  const container = document.getElementById("recentActivity");

  const recent = backups.slice(0, 5);

  if (recent.length === 0) {
    container.innerHTML = `
            <div class="empty-state">
                No backup activity yet.
            </div>
        `;

    return;
  }

  container.innerHTML = "";

  recent.forEach((backup) => {
    const row = document.createElement("div");

    row.className = "activity-row";

    row.innerHTML = `

                <div class="activity-main">

                    <span class="activity-icon">
                        ☁
                    </span>

                    <span>
                        ${escapeHtml(backup.type)}
                        backup completed -
                        ${escapeHtml(backup.name)}
                    </span>

                </div>

                <span class="activity-date">
                    ${escapeHtml(backup.date)}
                </span>

            `;

    container.appendChild(row);
  });
}

/* =========================================================
   LOCAL STORAGE
========================================================= */

function saveBackupHistory() {
  localStorage.setItem("backupHistory", JSON.stringify(backups));
}

function saveAutomaticSettingsToStorage() {
  localStorage.setItem("automaticSettings", JSON.stringify(automaticSettings));
}

/* =========================================================
   HELPERS
========================================================= */

function formatFileSize(bytes) {
  if (bytes < 1024) {
    return bytes + " B";
  }

  if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(1) + " KB";
  }

  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function getCurrentDateTime() {
  return new Date().toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getFrequencyText(minutes) {
  if (minutes === 1) {
    return "Every 1 minute";
  }

  if (minutes === 30) {
    return "Every 30 minutes";
  }

  if (minutes === 60) {
    return "Every 1 hour";
  }

  if (minutes === 360) {
    return "Every 6 hours";
  }

  if (minutes === 1440) {
    return "Once a day";
  }

  return `${minutes} minutes`;
}

function showToast(message) {
  const toast = document.getElementById("toast");

  toast.textContent = message;

  toast.style.display = "block";

  setTimeout(() => {
    toast.style.display = "none";
  }, 3000);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

//fixing error of MB:

function parseFileSize(sizeString) {
  const parts = sizeString.trim().split(" ");

  const value = parseFloat(parts[0]);

  const unit = parts[1]?.toUpperCase();

  if (isNaN(value)) {
    return 0;
  }

  switch (unit) {
    case "B":
      return value;

    case "KB":
      return value * 1024;

    case "MB":
      return value * 1024 * 1024;

    case "GB":
      return value * 1024 * 1024 * 1024;

    default:
      return 0;
  }
}

/* =========================================================
   INITIAL LOAD
========================================================= */

loadAutomaticSettings();

loadSettingsPage();

renderBackupHistory();

updateDashboard();

loadAutomaticBackupHistory();
