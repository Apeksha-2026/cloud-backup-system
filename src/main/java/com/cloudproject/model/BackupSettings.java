package com.cloudproject.model;

public class BackupSettings {

    private boolean enabled;

    private String folderPath;

    private int frequencyMinutes;

    private boolean backupModifiedFiles;

    private boolean includeSubfolders;


    public BackupSettings() {

        this.enabled = false;
        this.folderPath = "";
        this.frequencyMinutes = 60;
        this.backupModifiedFiles = true;
        this.includeSubfolders = true;

    }


    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }


    public String getFolderPath() {
        return folderPath;
    }

    public void setFolderPath(String folderPath) {
        this.folderPath = folderPath;
    }


    public int getFrequencyMinutes() {
        return frequencyMinutes;
    }

    public void setFrequencyMinutes(int frequencyMinutes) {
        this.frequencyMinutes = frequencyMinutes;
    }


    public boolean isBackupModifiedFiles() {
        return backupModifiedFiles;
    }

    public void setBackupModifiedFiles(
            boolean backupModifiedFiles
    ) {
        this.backupModifiedFiles =
                backupModifiedFiles;
    }


    public boolean isIncludeSubfolders() {
        return includeSubfolders;
    }

    public void setIncludeSubfolders(
            boolean includeSubfolders
    ) {
        this.includeSubfolders =
                includeSubfolders;
    }
}