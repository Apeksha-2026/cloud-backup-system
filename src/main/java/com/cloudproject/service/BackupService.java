package com.cloudproject.service;

import com.cloudproject.storage.CloudStorageService;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
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


    public int backupFiles(
            MultipartFile[] files
    ) throws IOException {

        int uploadedCount = 0;

        for (MultipartFile file : files) {

            if (file == null || file.isEmpty()) {
                continue;
            }

            cloudStorageService.uploadFile(file);

            uploadedCount++;
        }

        return uploadedCount;
    }


    public String backupLocalFile(
            Path file
    ) {

        try {

            return cloudStorageService.uploadFile(file);

        } catch (IOException e) {

            throw new RuntimeException(
                    "Automatic backup failed for: " + file,
                    e
            );
        }
    }
}