package com.cloudproject.service;

import com.cloudproject.storage.CloudStorageService;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

@Service
public class BackupService {

    private final CloudStorageService cloudStorageService;


    public BackupService(
            CloudStorageService cloudStorageService
    ) {

        this.cloudStorageService =
                cloudStorageService;

    }


    public String backupFile(
            MultipartFile file
    ) {

        if (
                file == null ||
                file.isEmpty()
        ) {

            throw new IllegalArgumentException(
                    "Please select a file."
            );

        }


        try {

            String storedLocation =
                    cloudStorageService.uploadFile(
                            file
                    );

            return storedLocation;

        } catch (IOException e) {

            throw new RuntimeException(
                    "Backup failed.",
                    e
            );

        }
    }


    public String backupLocalFile(
            Path file
    ) {

        try {

            return cloudStorageService.uploadFile(
                    file
            );

        } catch (IOException e) {

            throw new RuntimeException(
                    "Automatic backup failed for: "
                            + file,
                    e
            );

        }
    }
}