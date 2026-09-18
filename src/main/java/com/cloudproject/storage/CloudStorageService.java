package com.cloudproject.storage;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

@Service
public class CloudStorageService {

    private final Path storageDirectory =
            Paths.get("cloud-storage");


    public CloudStorageService() {

        try {

            Files.createDirectories(
                    storageDirectory
            );

        } catch (IOException e) {

            throw new RuntimeException(
                    "Unable to create cloud storage directory.",
                    e
            );

        }
    }


    public String uploadFile(
            MultipartFile file
    ) throws IOException {

        String originalFileName =
                file.getOriginalFilename();

        if (
                originalFileName == null ||
                originalFileName.isBlank()
        ) {

            throw new IllegalArgumentException(
                    "File name is invalid."
            );

        }


        Path destination =
                storageDirectory.resolve(
                        Path.of(originalFileName)
                                .getFileName()
                );


        try (
                InputStream inputStream =
                        file.getInputStream()
        ) {

            Files.copy(
                    inputStream,
                    destination,
                    StandardCopyOption.REPLACE_EXISTING
            );

        }


        return destination
                .toAbsolutePath()
                .toString();
    }


    public String uploadFile(
            Path localFile
    ) throws IOException {

        if (!Files.exists(localFile)) {

            throw new IOException(
                    "Source file does not exist: "
                            + localFile
            );

        }


        Path destination =
                storageDirectory.resolve(
                        localFile.getFileName()
                );


        Files.copy(
                localFile,
                destination,
                StandardCopyOption.REPLACE_EXISTING
        );


        return destination
                .toAbsolutePath()
                .toString();
    }


    public void deleteFile(
            String fileName
    ) throws IOException {

        Path file =
                storageDirectory.resolve(
                        Path.of(fileName)
                                .getFileName()
                );

        Files.deleteIfExists(file);

    }
}