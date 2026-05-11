package pl.dmod.crm.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import pl.dmod.crm.application.api.ApplicationMapper;
import pl.dmod.crm.application.api.dto.ApplicationDto;
import pl.dmod.crm.application.api.dto.CreateApplicationRequest;
import pl.dmod.crm.application.api.dto.UpdateApplicationRequest;
import pl.dmod.crm.application.domain.Application;
import pl.dmod.crm.application.domain.ApplicationSource;
import pl.dmod.crm.application.domain.ApplicationStatus;
import pl.dmod.crm.application.repository.ApplicationRepository;
import pl.dmod.crm.shared.exception.ResourceNotFoundException;
import pl.dmod.crm.shared.security.CurrentUserService;

class ApplicationServiceTest {

    private static final UUID CURRENT_USER = UUID.randomUUID();

    private final ApplicationRepository repository = mock(ApplicationRepository.class);
    private final CurrentUserService currentUser = mock(CurrentUserService.class);
    private final ApplicationService service =
            new ApplicationService(repository, new ApplicationMapper(), currentUser);

    ApplicationServiceTest() {
        when(currentUser.requireUserId()).thenReturn(CURRENT_USER);
    }

    @Test
    void create_persists_entity_with_applied_status_and_current_user() {
        CreateApplicationRequest req = new CreateApplicationRequest(
                "Acme", "Senior Java", null, ApplicationSource.JUSTJOIN,
                "Kraków", true, null, null, "PLN",
                LocalDate.of(2026, 5, 1), null, null, Set.of("remote"));
        when(repository.save(any(Application.class))).thenAnswer(inv -> {
            Application a = inv.getArgument(0);
            a.setId(UUID.randomUUID());
            return a;
        });

        ApplicationDto dto = service.create(req);

        assertThat(dto.companyName()).isEqualTo("Acme");
        assertThat(dto.currentStatus()).isEqualTo(ApplicationStatus.APPLIED);
        assertThat(dto.tags()).containsExactly("remote");
        verify(repository).save(any(Application.class));
    }

    @Test
    void getById_throws_when_missing() {
        UUID id = UUID.randomUUID();
        when(repository.findById(id)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.getById(id))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining(id.toString());
    }

    @Test
    void getById_throws_when_application_belongs_to_other_user() {
        UUID id = UUID.randomUUID();
        Application other = new Application();
        other.setId(id);
        other.setUserId(UUID.randomUUID()); // different user
        when(repository.findById(id)).thenReturn(Optional.of(other));

        assertThatThrownBy(() -> service.getById(id))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void update_only_applies_non_null_fields() {
        UUID id = UUID.randomUUID();
        Application existing = ownedApplication(id);

        when(repository.findById(id)).thenReturn(Optional.of(existing));
        when(repository.save(any(Application.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateApplicationRequest req = new UpdateApplicationRequest(
                "New Co", null, null, null, null, null, null, null, null, null, null, null, null, null);
        ApplicationDto dto = service.update(id, req);

        assertThat(dto.companyName()).isEqualTo("New Co");
        assertThat(dto.position()).isEqualTo("Engineer"); // unchanged
    }

    @Test
    void changeStatus_moves_owned_application_to_target_state() {
        UUID id = UUID.randomUUID();
        Application existing = ownedApplication(id);
        when(repository.findById(id)).thenReturn(Optional.of(existing));
        when(repository.save(any(Application.class))).thenAnswer(inv -> inv.getArgument(0));

        ApplicationDto dto = service.changeStatus(id, ApplicationStatus.INTERVIEW_SCHEDULED);
        assertThat(dto.currentStatus()).isEqualTo(ApplicationStatus.INTERVIEW_SCHEDULED);
    }

    @Test
    void delete_throws_when_id_unknown() {
        UUID id = UUID.randomUUID();
        when(repository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.delete(id))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void delete_removes_owned_application() {
        UUID id = UUID.randomUUID();
        Application existing = ownedApplication(id);
        when(repository.findById(id)).thenReturn(Optional.of(existing));

        service.delete(id);
        verify(repository).delete(existing);
    }

    private Application ownedApplication(UUID id) {
        Application a = new Application();
        a.setId(id);
        a.setUserId(CURRENT_USER);
        a.setCompanyName("Old Co");
        a.setPosition("Engineer");
        a.setSource(ApplicationSource.OTHER);
        a.setAppliedAt(LocalDate.of(2026, 4, 1));
        a.setCurrentStatus(ApplicationStatus.APPLIED);
        return a;
    }
}
