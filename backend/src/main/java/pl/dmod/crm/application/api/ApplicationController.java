package pl.dmod.crm.application.api;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import pl.dmod.crm.application.api.dto.ApplicationDto;
import pl.dmod.crm.application.api.dto.ChangeStatusRequest;
import pl.dmod.crm.application.api.dto.CreateApplicationRequest;
import pl.dmod.crm.application.api.dto.UpdateApplicationRequest;
import pl.dmod.crm.application.domain.ApplicationStatus;
import pl.dmod.crm.application.service.ApplicationService;

@RestController
@RequestMapping("/api/v1/applications")
@Tag(name = "Applications", description = "Job application lifecycle management")
public class ApplicationController {

    private final ApplicationService service;

    public ApplicationController(ApplicationService service) {
        this.service = service;
    }

    @GetMapping
    @Operation(summary = "List applications", description = "Paged list of applications. Filters: status, search (matches company name or position), archived (defaults to false).")
    public Page<ApplicationDto> list(
            @RequestParam(required = false) ApplicationStatus status,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean archived,
            @Parameter(hidden = true) @PageableDefault(size = 20) Pageable pageable) {
        return service.list(status, search, archived, pageable);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get application by id")
    public ApplicationDto get(@PathVariable UUID id) {
        return service.getById(id);
    }

    @PostMapping
    @Operation(summary = "Create a new application")
    public ResponseEntity<ApplicationDto> create(@Valid @RequestBody CreateApplicationRequest req) {
        ApplicationDto created = service.create(req);
        return ResponseEntity.created(URI.create("/api/v1/applications/" + created.id())).body(created);
    }

    @PatchMapping("/{id}")
    @Operation(summary = "Partial update of an application")
    public ApplicationDto update(@PathVariable UUID id,
                                 @Valid @RequestBody UpdateApplicationRequest req) {
        return service.update(id, req);
    }

    @PostMapping("/{id}/status")
    @Operation(summary = "Change current status",
            description = "Currently overwrites the status. Faza 6 will record a StatusChange audit row.")
    public ApplicationDto changeStatus(@PathVariable UUID id,
                                       @Valid @RequestBody ChangeStatusRequest req) {
        return service.changeStatus(id, req.status());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete an application")
    public void delete(@PathVariable UUID id) {
        service.delete(id);
    }
}
