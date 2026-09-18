package com.cloudproject.controller;

import com.cloudproject.model.BackupSettings;
import com.cloudproject.service.AutomaticBackupService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/settings")
@CrossOrigin
public class SettingsController {

    private final AutomaticBackupService automaticBackupService;


    public SettingsController(
            AutomaticBackupService automaticBackupService
    ) {

        this.automaticBackupService =
                automaticBackupService;

    }


    @PostMapping("/automatic-backup")
    public ResponseEntity<BackupSettings> saveAutomaticSettings(
            @RequestBody BackupSettings settings
    ) {

        automaticBackupService.updateSettings(
                settings
        );

        return ResponseEntity.ok(
                automaticBackupService.getSettings()
        );
    }


    @GetMapping("/automatic-backup")
    public ResponseEntity<BackupSettings> getAutomaticSettings() {

        return ResponseEntity.ok(
                automaticBackupService.getSettings()
        );
    }
}