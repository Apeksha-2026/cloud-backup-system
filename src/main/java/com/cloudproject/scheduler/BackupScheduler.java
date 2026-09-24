package com.cloudproject.scheduler;

import com.cloudproject.service.AutomaticBackupService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class BackupScheduler {

    private final AutomaticBackupService automaticBackupService;

    public BackupScheduler(
            AutomaticBackupService automaticBackupService
    ) {
        this.automaticBackupService =
                automaticBackupService;
    }

    @Scheduled(fixedRate = 60000)
    public void checkForAutomaticBackup() {

        automaticBackupService.runBackupCheck();

    }
}