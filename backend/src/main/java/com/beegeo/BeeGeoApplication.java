package com.beegeo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class BeeGeoApplication {

    public static void main(String[] args) {
        SpringApplication.run(BeeGeoApplication.class, args);
    }
}
