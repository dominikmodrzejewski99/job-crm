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
import pl.dmod.crm.shared.security.CurrentUserService;

/**
 * Use cases around the {@link Application} aggregate. Every read / write
 * scopes itself to the current authenticated user — the user id comes from
 * {@link CurrentUserService}, which reads the Spring Security context
 * populated by the JWT filter.
 */
@Service
@Transactional
public class ApplicationService {

    private final ApplicationRepository repository;
    private final ApplicationMapper mapper;
    private final CurrentUserService currentUser;

    public ApplicationService(ApplicationRepository repository, ApplicationMapper mapper,
                              CurrentUserService currentUser) {
        this.repository = repository;
        this.mapper = mapper;
        this.currentUser = currentUser;
    }

    @Transactional(readOnly = true)
    public Page<ApplicationDto> list(ApplicationStatus status, String search, Boolean archived,
                                     Pageable pageable) {
        UUID userId = currentUser.requireUserId();
        boolean wantArchived = archived != null && archived;
        Specification<Application> spec = (root, q, cb) -> cb.and(
                cb.equal(root.get("userId"), userId),
                cb.equal(root.get("archived"), wantArchived)
        );
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
        entity.setUserId(currentUser.requireUserId());
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
        Application app = loadOrThrow(id);
        repository.delete(app);
    }

    /**
     * Loads the entity by id, but only if it belongs to the current user.
     * Returns {@code ResourceNotFoundException} (404) when the row exists but
     * belongs to someone else — same shape as a true miss so existence does
     * not leak across tenants.
     */
    private Application loadOrThrow(UUID id) {
        Application app = repository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Application", id));
        UUID userId = currentUser.requireUserId();
        if (!userId.equals(app.getUserId())) {
            throw ResourceNotFoundException.of("Application", id);
        }
        return app;
    }
}
