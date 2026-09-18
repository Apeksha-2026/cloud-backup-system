package com.cloudproject.scheduler;

import com.cloudproject.model.BackupSettings;
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


    /*
       The scheduler checks every minute.

       The AutomaticBackupService decides
       whether automatic backup is currently
       enabled and whether the configured
       folder should be scanned.
    */
    @Scheduled(fixedRate = 60000)
    public void checkForAutomaticBackup() {

        automaticBackupService.runBackupCheck();

    }
}