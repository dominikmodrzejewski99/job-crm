package pl.dmod.crm;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Job-CRM Spring Boot entry point. Scheduling is enabled here so the
 * follow-up reminder cron and the JJIT/NFJ job-board crawler can run
 * automatically without any further wiring at the bean level.
 */
@SpringBootApplication
@EnableScheduling
public class CrmApplication {

    public static void main(String[] args) {
        SpringApplication.run(CrmApplication.class, args);
    }
}
