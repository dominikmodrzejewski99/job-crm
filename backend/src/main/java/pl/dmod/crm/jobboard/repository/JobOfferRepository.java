package pl.dmod.crm.jobboard.repository;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import pl.dmod.crm.jobboard.domain.JobBoardSource;
import pl.dmod.crm.jobboard.domain.JobOffer;

public interface JobOfferRepository extends JpaRepository<JobOffer, UUID> {

    Optional<JobOffer> findBySourceAndExternalId(JobBoardSource source, String externalId);

    Page<JobOffer> findAllByOrderByFetchedAtDesc(Pageable pageable);

    Page<JobOffer> findBySourceOrderByFetchedAtDesc(JobBoardSource source, Pageable pageable);
}
