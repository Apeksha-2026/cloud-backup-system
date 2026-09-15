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

let backups = JSON.parse(localStorage.getItem("backupHistory")) || [];

let automaticSettings = JSON.parse(
  localStorage.getItem("automaticSettings"),
) || {
  enabled: true,

  folder: "",

  frequency: 60,

  modifiedFiles: true,

  subfolders: true,
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
}

/* =========================================================
   MANUAL FILE SELECTION
========================================================= */

const fileInput = document.getElementById("fileInput");

const folderInput = document.getElementById("folderInput");

const selectedItem = document.getElementById("selectedItem");

function selectFile() {
  fileInput.click();
}

function selectFolder() {
  folderInput.click();
}

fileInput.addEventListener("change", function () {
  if (!fileInput.files.length) {
    return;
  }

  const file = fileInput.files[0];

  selectedItem.textContent = `Selected file: ${file.name} (${formatFileSize(file.size)})`;
});

folderInput.addEventListener("change", function () {
  if (!folderInput.files.length) {
    return;
  }

  const files = Array.from(folderInput.files);

  selectedItem.textContent = `Selected folder containing ${files.length} file(s).`;
});

/* =========================================================
   MANUAL BACKUP
========================================================= */

const manualBackupButton = document.getElementById("manualBackupButton");

manualBackupButton.addEventListener("click", function () {
  if (fileInput.files.length === 0 && folderInput.files.length === 0) {
    showToast("Please select a file or folder first.");

    return;
  }

  let file;

  if (fileInput.files.length > 0) {
    file = fileInput.files[0];
  } else {
    file = folderInput.files[0];
  }

  const newBackup = {
    id: Date.now(),

    name: file.name,

    size: formatFileSize(file.size),

    date: getCurrentDateTime(),

    type: "Manual",

    status: "Backed Up",
  };

  backups.unshift(newBackup);

  saveBackupHistory();

  renderBackupHistory();

  updateDashboard();

  showToast(`${file.name} backed up successfully.`);

  fileInput.value = "";

  folderInput.value = "";

  selectedItem.textContent = "Nothing selected";
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

  backupFolder.value = automaticSettings.folder;

  backupFrequency.value = automaticSettings.frequency;

  modifiedFiles.checked = automaticSettings.modifiedFiles;

  subfolders.checked = automaticSettings.subfolders;
}

function selectAutomaticFolder() {
  /*
       Browser security does not allow JavaScript
       to read an arbitrary computer folder path.

       During Phase 3, the Java backend will handle
       the real folder monitoring.

       For Phase 2 we let the user enter/display
       the intended folder through the settings page.
    */

  const folder = prompt(
    "Enter the folder path to monitor:",
    automaticSettings.folder,
  );

  if (folder !== null) {
    backupFolder.value = folder;
  }
}

function saveAutomaticSettings() {
  automaticSettings = {
    enabled: backupToggle.checked,

    folder: backupFolder.value,

    frequency: Number(backupFrequency.value),

    modifiedFiles: modifiedFiles.checked,

    subfolders: subfolders.checked,
  };

  saveAutomaticSettingsToStorage();

  updateAutomaticStatus();

  showToast("Automatic backup settings saved.");
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

  settingsFolder.value = automaticSettings.folder;

  settingsFrequency.value = automaticSettings.frequency;

  settingsModified.checked = automaticSettings.modifiedFiles;

  settingsSubfolders.checked = automaticSettings.subfolders;
}

function selectSettingsFolder() {
  const folder = prompt(
    "Enter the folder that contains your important files:",
    automaticSettings.folder,
  );

  if (folder !== null) {
    settingsFolder.value = folder;
  }
}

function saveSettingsPage() {
  automaticSettings = {
    enabled: settingsAutoToggle.checked,

    folder: settingsFolder.value,

    frequency: Number(settingsFrequency.value),

    modifiedFiles: settingsModified.checked,

    subfolders: settingsSubfolders.checked,
  };

  saveAutomaticSettingsToStorage();

  loadAutomaticSettings();

  updateAutomaticStatus();

  showToast("Settings saved successfully.");
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

    const frequencyText = getFrequencyText(automaticSettings.frequency);

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

  total.textContent = backups.length;

  files.textContent = backups.length;

  //Fixing the error of MB:
  let totalBytes = 0;

  backups.forEach((backup) => {
    totalBytes += parseFileSize(backup.size);
  });

  storage.textContent = formatFileSize(totalBytes);

  last.textContent = backups.length > 0 ? backups[0].date : "None";

  renderRecentActivity();

  updateAutomaticStatus();
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
