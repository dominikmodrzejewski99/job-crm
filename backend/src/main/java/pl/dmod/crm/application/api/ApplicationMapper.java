package pl.dmod.crm.application.api;

import java.util.HashSet;
import java.util.Set;
import org.springframework.stereotype.Component;
import pl.dmod.crm.application.api.dto.ApplicationDto;
import pl.dmod.crm.application.api.dto.CreateApplicationRequest;
import pl.dmod.crm.application.api.dto.UpdateApplicationRequest;
import pl.dmod.crm.application.domain.Application;

/**
 * Hand-rolled mapper between {@link Application} JPA entity and the
 * outward-facing DTOs. Kept manual rather than reaching for MapStruct so the
 * dependency tree stays small for Faza 3.
 */
@Component
public class ApplicationMapper {

    public ApplicationDto toDto(Application entity) {
        return new ApplicationDto(
                entity.getId(),
                entity.getCompanyName(),
                entity.getPosition(),
                entity.getJobUrl(),
                entity.getSource(),
                entity.getLocation(),
                entity.isRemote(),
                entity.getSalaryMin(),
                entity.getSalaryMax(),
                entity.getCurrency(),
                entity.getAppliedAt(),
                entity.getCurrentStatus(),
                entity.getNextFollowUpAt(),
                entity.isArchived(),
                entity.getNotes(),
                Set.copyOf(entity.getTags()),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    public Application fromCreate(CreateApplicationRequest req) {
        Application a = new Application();
        a.setCompanyName(req.companyName());
        a.setPosition(req.position());
        a.setJobUrl(req.jobUrl());
        a.setSource(req.source());
        a.setLocation(req.location());
        a.setRemote(req.remote());
        a.setSalaryMin(req.salaryMin());
        a.setSalaryMax(req.salaryMax());
        a.setCurrency(req.currency());
        a.setAppliedAt(req.appliedAt());
        a.setNextFollowUpAt(req.nextFollowUpAt());
        a.setNotes(req.notes());
        a.setTags(req.tags() == null ? new HashSet<>() : new HashSet<>(req.tags()));
        return a;
    }

    public void applyUpdate(Application entity, UpdateApplicationRequest req) {
        if (req.companyName() != null) entity.setCompanyName(req.companyName());
        if (req.position() != null) entity.setPosition(req.position());
        if (req.jobUrl() != null) entity.setJobUrl(req.jobUrl());
        if (req.source() != null) entity.setSource(req.source());
        if (req.location() != null) entity.setLocation(req.location());
        if (req.remote() != null) entity.setRemote(req.remote());
        if (req.salaryMin() != null) entity.setSalaryMin(req.salaryMin());
        if (req.salaryMax() != null) entity.setSalaryMax(req.salaryMax());
        if (req.currency() != null) entity.setCurrency(req.currency());
        if (req.appliedAt() != null) entity.setAppliedAt(req.appliedAt());
        if (req.nextFollowUpAt() != null) entity.setNextFollowUpAt(req.nextFollowUpAt());
        if (req.archived() != null) entity.setArchived(req.archived());
        if (req.notes() != null) entity.setNotes(req.notes());
        if (req.tags() != null) entity.setTags(new HashSet<>(req.tags()));
    }
}
