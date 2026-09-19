package com.cloudproject.controller;

import com.cloudproject.service.BackupService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin
public class BackupController {

    private final BackupService backupService;

    public BackupController(BackupService backupService) {
        this.backupService = backupService;
    }

    @PostMapping("/backup")
    public ResponseEntity<?> backupFiles(
            @RequestParam("files") MultipartFile[] files
    ) {

        if (files == null || files.length == 0) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            Map.of(
                                    "success", false,
                                    "message",
                                    "Please select at least one file."
                            )
                    );
        }

        try {

            int uploadedCount =
                    backupService.backupFiles(files);

            return ResponseEntity.ok(
                    Map.of(
                            "success", true,
                            "message",
                            uploadedCount +
                                    " file(s) backed up successfully.",
                            "fileCount",
                            uploadedCount
                    )
            );

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .internalServerError()
                    .body(
                            Map.of(
                                    "success", false,
                                    "message",
                                    "Backup failed: " +
                                            e.getMessage()
                            )
                    );
        }
    }
}