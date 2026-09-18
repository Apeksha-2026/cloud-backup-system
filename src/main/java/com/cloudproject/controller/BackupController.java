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


    public BackupController(
            BackupService backupService
    ) {

        this.backupService =
                backupService;

    }


    @PostMapping("/backup")
    public ResponseEntity<?> backupFile(
            @RequestParam("file")
            MultipartFile file
    ) {

        try {

            String location =
                    backupService.backupFile(
                            file
                    );


            return ResponseEntity.ok(
                    Map.of(
                            "success", true,
                            "message",
                            "File backed up successfully.",
                            "fileName",
                            file.getOriginalFilename(),
                            "location",
                            location
                    )
            );

        } catch (IllegalArgumentException e) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            Map.of(
                                    "success", false,
                                    "message",
                                    e.getMessage()
                            )
                    );

        } catch (Exception e) {

            return ResponseEntity
                    .internalServerError()
                    .body(
                            Map.of(
                                    "success", false,
                                    "message",
                                    "Backup failed."
                            )
                    );

        }
    }
}