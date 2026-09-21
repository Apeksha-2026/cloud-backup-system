package com.cloudproject.service;

import com.cloudproject.model.BackupSettings;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.*;
import java.util.HashMap;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
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

            /* Stores automatic backup history temporarily.
   Later this will be replaced by the database. */
private final List<Map<String, Object>> automaticBackupHistory =
        new ArrayList<>();


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

                Map<String, Object> historyItem = new HashMap<>();

                historyItem.put("id", System.currentTimeMillis());

                historyItem.put("name", file.getFileName().toString());

                historyItem.put(
                        "size",
                        Files.size(file) + " B"
                );

                historyItem.put(
                        "date",
                        LocalDateTime.now().format(
                                DateTimeFormatter.ofPattern(
                                        "dd MMM yyyy, hh:mm a"
                                )
                        )
                );

                historyItem.put("type", "Automatic");

                historyItem.put("status", "Backed Up");

                automaticBackupHistory.add(historyItem);

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

Map<String, Object> historyItem = new HashMap<>();

historyItem.put("id", System.currentTimeMillis());

historyItem.put("name", file.getFileName().toString());

historyItem.put(
        "size",
        Files.size(file) + " B"
);

historyItem.put(
        "date",
        LocalDateTime.now().format(
                DateTimeFormatter.ofPattern(
                        "dd MMM yyyy, hh:mm a"
                )
        )
);

historyItem.put("type", "Automatic");

historyItem.put("status", "Backed Up");

automaticBackupHistory.add(historyItem);

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

    public synchronized List<Map<String, Object>> getAutomaticBackupHistory() {
    return new ArrayList<>(automaticBackupHistory);
}
}