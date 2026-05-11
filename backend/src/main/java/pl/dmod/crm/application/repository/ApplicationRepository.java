package pl.dmod.crm.application.repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pl.dmod.crm.application.domain.Application;
import pl.dmod.crm.application.domain.ApplicationStatus;

/**
 * Spring Data repository for {@link Application}. JpaSpecificationExecutor is
 * mixed in so the service can build dynamic filters (status set, archived,
 * search term) without hand-writing JPQL for every combination.
 */
public interface ApplicationRepository extends JpaRepository<Application, UUID>,
        JpaSpecificationExecutor<Application> {

    List<Application> findByCurrentStatus(ApplicationStatus status);

    Page<Application> findByArchivedFalse(Pageable pageable);

    @Query("""
           select a from Application a
           where a.archived = false
             and (lower(a.companyName) like lower(concat('%', :term, '%'))
                  or lower(a.position) like lower(concat('%', :term, '%')))
           """)
    Page<Application> search(@Param("term") String term, Pageable pageable);

    long countByCurrentStatus(ApplicationStatus status);

    /** Applications whose reminder is due but hasn't been emailed yet. */
    @Query("""
           select a from Application a
           where a.archived = false
             and a.nextFollowUpAt is not null
             and a.nextFollowUpAt <= :now
             and a.nextFollowUpReminderSentAt is null
           """)
    List<Application> findPendingReminders(@Param("now") Instant now);

    /** Per-user list of upcoming or overdue follow-ups, soonest first. */
    @Query("""
           select a from Application a
           where a.userId = :userId
             and a.archived = false
             and a.nextFollowUpAt is not null
             and a.nextFollowUpAt <= :horizon
           order by a.nextFollowUpAt asc
           """)
    List<Application> findUpcomingForUser(@Param("userId") UUID userId,
                                          @Param("horizon") Instant horizon);
}
