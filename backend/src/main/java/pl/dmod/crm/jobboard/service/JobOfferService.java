package pl.dmod.crm.jobboard.service;

import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.dmod.crm.application.api.dto.ApplicationDto;
import pl.dmod.crm.application.api.dto.CreateApplicationRequest;
import pl.dmod.crm.application.domain.ApplicationSource;
import pl.dmod.crm.application.service.ApplicationService;
import pl.dmod.crm.jobboard.api.dto.JobOfferDto;
import pl.dmod.crm.jobboard.domain.JobBoardSource;
import pl.dmod.crm.jobboard.domain.JobOffer;
import pl.dmod.crm.jobboard.repository.JobOfferRepository;
import pl.dmod.crm.shared.exception.ResourceNotFoundException;

@Service
@Transactional
public class JobOfferService {

    private final JobOfferRepository repository;
    private final ApplicationService applicationService;

    public JobOfferService(JobOfferRepository repository, ApplicationService applicationService) {
        this.repository = repository;
        this.applicationService = applicationService;
    }

    @Transactional(readOnly = true)
    public Page<JobOfferDto> list(JobBoardSource source, Pageable pageable) {
        Page<JobOffer> page = source != null
                ? repository.findBySourceOrderByFetchedAtDesc(source, pageable)
                : repository.findAllByOrderByFetchedAtDesc(pageable);
        return page.map(this::toDto);
    }

    public ApplicationDto saveAsApplication(UUID offerId) {
        JobOffer offer = repository.findById(offerId)
                .orElseThrow(() -> ResourceNotFoundException.of("JobOffer", offerId));
        CreateApplicationRequest req = new CreateApplicationRequest(
                offer.getCompanyName(),
                offer.getTitle(),
                offer.getUrl(),
                mapSource(offer.getSource()),
                offer.getLocation(),
                offer.isRemote(),
                offer.getSalaryMin(),
                offer.getSalaryMax(),
                offer.getCurrency(),
                java.time.LocalDate.now(),
                null,
                null,
                null
        );
        return applicationService.create(req);
    }

    private ApplicationSource mapSource(JobBoardSource source) {
        return switch (source) {
            case JUSTJOIN -> ApplicationSource.JUSTJOIN;
            case NOFLUFF -> ApplicationSource.NOFLUFF;
        };
    }

    private JobOfferDto toDto(JobOffer o) {
        return new JobOfferDto(
                o.getId(), o.getSource(), o.getExternalId(), o.getTitle(), o.getCompanyName(),
                o.getLocation(), o.isRemote(), o.getSalaryMin(), o.getSalaryMax(), o.getCurrency(),
                o.getUrl(), o.getPostedAt(), o.getFetchedAt()
        );
    }
}
