package com.cloudproject.service;

import com.cloudproject.model.BackupSettings;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.*;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Stream;

@Service
public class AutomaticBackupService {

    private final BackupService backupService;

    private BackupSettings settings =
            new BackupSettings();

    /*
       Stores the last modified time of files
       that have already been backed up.
    */
    private final Map<String, Long> backedUpFiles =
            new HashMap<>();


    public AutomaticBackupService(
            BackupService backupService
    ) {

        this.backupService =
                backupService;

    }


    public synchronized void updateSettings(
            BackupSettings newSettings
    ) {

        this.settings =
                newSettings;

    }


    public synchronized BackupSettings getSettings() {

        return settings;

    }


    public void runBackupCheck() {

        if (!settings.isEnabled()) {

            return;

        }


        if (
                settings.getFolderPath() == null ||
                settings.getFolderPath().isBlank()
        ) {

            return;

        }


        Path folder =
                Paths.get(
                        settings.getFolderPath()
                );


        if (!Files.exists(folder)) {

            System.out.println(
                    "Automatic backup folder does not exist: "
                            + folder
            );

            return;

        }


        if (!Files.isDirectory(folder)) {

            System.out.println(
                    "Automatic backup path is not a folder: "
                            + folder
            );

            return;

        }


        try {

            if (settings.isIncludeSubfolders()) {

                try (
                        Stream<Path> files =
                                Files.walk(folder)
                ) {

                    files
                            .filter(Files::isRegularFile)
                            .forEach(
                                    this::processFile
                            );

                }

            } else {

                try (
                        Stream<Path> files =
                                Files.list(folder)
                ) {

                    files
                            .filter(Files::isRegularFile)
                            .forEach(
                                    this::processFile
                            );

                }

            }

        } catch (IOException e) {

            System.err.println(
                    "Automatic backup scan failed: "
                            + e.getMessage()
            );

        }
    }


    private void processFile(
            Path file
    ) {

        try {

            long modifiedTime =
                    Files.getLastModifiedTime(
                            file
                    ).toMillis();


            String key =
                    file.toAbsolutePath()
                            .toString();


            Long previousModifiedTime =
                    backedUpFiles.get(key);


            boolean isNew =
                    previousModifiedTime == null;


            boolean isModified =
                    previousModifiedTime != null &&
                    modifiedTime >
                            previousModifiedTime;


            if (isNew) {

                backupService.backupLocalFile(
                        file
                );

                backedUpFiles.put(
                        key,
                        modifiedTime
                );

                System.out.println(
                        "Automatically backed up: "
                                + file
                );

                return;

            }


            if (
                    settings.isBackupModifiedFiles() &&
                    isModified
            ) {

                backupService.backupLocalFile(
                        file
                );

                backedUpFiles.put(
                        key,
                        modifiedTime
                );

                System.out.println(
                        "Automatically backed up modified file: "
                                + file
                );

            }

        } catch (Exception e) {

            System.err.println(
                    "Could not backup file "
                            + file
                            + ": "
                            + e.getMessage()
            );

        }

    }
}