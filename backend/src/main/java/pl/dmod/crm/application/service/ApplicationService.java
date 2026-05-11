package pl.dmod.crm.application.service;

import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import pl.dmod.crm.application.api.ApplicationMapper;
import pl.dmod.crm.application.api.dto.ApplicationDto;
import pl.dmod.crm.application.api.dto.CreateApplicationRequest;
import pl.dmod.crm.application.api.dto.UpdateApplicationRequest;
import pl.dmod.crm.application.domain.Application;
import pl.dmod.crm.application.domain.ApplicationStatus;
import pl.dmod.crm.application.repository.ApplicationRepository;
import pl.dmod.crm.shared.exception.ResourceNotFoundException;

/**
 * Use cases around the {@link Application} aggregate. Kept thin — controller-
 * facing logic only — so that more elaborate behaviour (status transition
 * audit, follow-up scheduling) can land in later phases without rewriting
 * this layer.
 */
@Service
@Transactional
public class ApplicationService {

    private final ApplicationRepository repository;
    private final ApplicationMapper mapper;

    public ApplicationService(ApplicationRepository repository, ApplicationMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @Transactional(readOnly = true)
    public Page<ApplicationDto> list(ApplicationStatus status, String search, Boolean archived,
                                     Pageable pageable) {
        boolean wantArchived = archived != null && archived;
        Specification<Application> spec = (root, q, cb) ->
                cb.equal(root.get("archived"), wantArchived);
        if (status != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("currentStatus"), status));
        }
        if (StringUtils.hasText(search)) {
            String like = "%" + search.trim().toLowerCase() + "%";
            spec = spec.and((root, q, cb) -> cb.or(
                    cb.like(cb.lower(root.get("companyName")), like),
                    cb.like(cb.lower(root.get("position")), like)
            ));
        }
        return repository.findAll(spec, pageable).map(mapper::toDto);
    }

    @Transactional(readOnly = true)
    public ApplicationDto getById(UUID id) {
        return mapper.toDto(loadOrThrow(id));
    }

    public ApplicationDto create(CreateApplicationRequest req) {
        Application entity = mapper.fromCreate(req);
        if (entity.getCurrentStatus() == null) {
            entity.setCurrentStatus(ApplicationStatus.APPLIED);
        }
        return mapper.toDto(repository.save(entity));
    }

    public ApplicationDto update(UUID id, UpdateApplicationRequest req) {
        Application entity = loadOrThrow(id);
        mapper.applyUpdate(entity, req);
        return mapper.toDto(repository.save(entity));
    }

    public ApplicationDto changeStatus(UUID id, ApplicationStatus next) {
        Application entity = loadOrThrow(id);
        entity.setCurrentStatus(next);
        return mapper.toDto(repository.save(entity));
    }

    public void delete(UUID id) {
        if (!repository.existsById(id)) {
            throw ResourceNotFoundException.of("Application", id);
        }
        repository.deleteById(id);
    }

    private Application loadOrThrow(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Application", id));
    }
}
