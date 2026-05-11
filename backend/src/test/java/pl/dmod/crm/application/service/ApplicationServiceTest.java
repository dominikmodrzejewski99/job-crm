package pl.dmod.crm.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
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

class ApplicationServiceTest {

    private final ApplicationRepository repository = mock(ApplicationRepository.class);
    private final ApplicationService service = new ApplicationService(repository, new ApplicationMapper());

    @Test
    void create_persists_entity_with_applied_status_when_none_provided() {
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
    void update_only_applies_non_null_fields() {
        UUID id = UUID.randomUUID();
        Application existing = new Application();
        existing.setId(id);
        existing.setCompanyName("Old Co");
        existing.setPosition("Old Position");
        existing.setSource(ApplicationSource.OTHER);
        existing.setAppliedAt(LocalDate.of(2026, 4, 1));
        existing.setCurrentStatus(ApplicationStatus.APPLIED);

        when(repository.findById(id)).thenReturn(Optional.of(existing));
        when(repository.save(any(Application.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateApplicationRequest req = new UpdateApplicationRequest(
                "New Co", null, null, null, null, null, null, null, null, null, null, null, null, null);
        ApplicationDto dto = service.update(id, req);

        assertThat(dto.companyName()).isEqualTo("New Co");
        assertThat(dto.position()).isEqualTo("Old Position"); // unchanged
    }

    @Test
    void changeStatus_moves_application_to_target_state() {
        UUID id = UUID.randomUUID();
        Application existing = new Application();
        existing.setId(id);
        existing.setCurrentStatus(ApplicationStatus.APPLIED);
        existing.setCompanyName("X");
        existing.setPosition("Y");
        existing.setSource(ApplicationSource.OTHER);
        existing.setAppliedAt(LocalDate.now());

        when(repository.findById(id)).thenReturn(Optional.of(existing));
        when(repository.save(any(Application.class))).thenAnswer(inv -> inv.getArgument(0));

        ApplicationDto dto = service.changeStatus(id, ApplicationStatus.INTERVIEW_SCHEDULED);
        assertThat(dto.currentStatus()).isEqualTo(ApplicationStatus.INTERVIEW_SCHEDULED);
    }

    @Test
    void delete_throws_when_id_unknown_and_does_not_call_repo() {
        UUID id = UUID.randomUUID();
        when(repository.existsById(id)).thenReturn(false);

        assertThatThrownBy(() -> service.delete(id))
                .isInstanceOf(ResourceNotFoundException.class);
        verify(repository, never()).deleteById(any());
    }

    @Test
    void delete_calls_repo_when_id_present() {
        UUID id = UUID.randomUUID();
        when(repository.existsById(id)).thenReturn(true);

        service.delete(id);
        verify(repository, times(1)).deleteById(id);
    }
}
