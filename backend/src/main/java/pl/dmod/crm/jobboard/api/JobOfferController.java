package pl.dmod.crm.jobboard.api;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pl.dmod.crm.application.api.dto.ApplicationDto;
import pl.dmod.crm.jobboard.api.dto.JobOfferDto;
import pl.dmod.crm.jobboard.domain.JobBoardSource;
import pl.dmod.crm.jobboard.service.JobBoardCrawlerService;
import pl.dmod.crm.jobboard.service.JobOfferService;

@RestController
@RequestMapping("/api/v1/joboffers")
@Tag(name = "Job offers", description = "Crawled offers from JustJoinIT + NoFluffJobs")
public class JobOfferController {

    private final JobOfferService offers;
    private final JobBoardCrawlerService crawler;

    public JobOfferController(JobOfferService offers, JobBoardCrawlerService crawler) {
        this.offers = offers;
        this.crawler = crawler;
    }

    @GetMapping
    @Operation(summary = "List crawled offers")
    public Page<JobOfferDto> list(@RequestParam(required = false) JobBoardSource source,
                                  @Parameter(hidden = true) @PageableDefault(size = 50) Pageable pageable) {
        return offers.list(source, pageable);
    }

    @PostMapping("/{id}/save-as-application")
    @Operation(summary = "Create an Application owned by the current user from this offer")
    public ApplicationDto saveAsApplication(@PathVariable UUID id) {
        return offers.saveAsApplication(id);
    }

    @PostMapping("/refresh")
    @Operation(summary = "Trigger the crawler now (in addition to the 6h scheduler)")
    public JobBoardCrawlerService.CrawlReport refresh() {
        return crawler.runOnce();
    }
}
