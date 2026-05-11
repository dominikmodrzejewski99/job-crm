package pl.dmod.crm.application.domain;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

/**
 * A single job application a user has submitted (or is drafting). Owns the
 * core lifecycle state {@link ApplicationStatus} plus enough metadata to
 * drive the dashboard, the table view, and follow-up reminders. Per-user
 * scoping (userId) lands in Faza 4 when auth is introduced.
 */
@Entity
@Table(name = "applications")
public class Application {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "company_name", nullable = false, length = 200)
    private String companyName;

    @Column(name = "position", nullable = false, length = 200)
    private String position;

    @Column(name = "job_url", length = 500)
    private String jobUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "source", nullable = false, length = 32)
    private ApplicationSource source;

    @Column(name = "location", length = 200)
    private String location;

    @Column(name = "remote", nullable = false)
    private boolean remote;

    @Column(name = "salary_min", precision = 12, scale = 2)
    private BigDecimal salaryMin;

    @Column(name = "salary_max", precision = 12, scale = 2)
    private BigDecimal salaryMax;

    @Column(name = "currency", length = 3)
    private String currency;

    @Column(name = "applied_at", nullable = false)
    private LocalDate appliedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "current_status", nullable = false, length = 32)
    private ApplicationStatus currentStatus;

    @Column(name = "next_follow_up_at")
    private Instant nextFollowUpAt;

    @Column(name = "archived", nullable = false)
    private boolean archived;

    @Column(name = "notes", columnDefinition = "text")
    private String notes;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "application_tag",
            joinColumns = @JoinColumn(name = "application_id"))
    @Column(name = "tag", length = 64, nullable = false)
    private Set<String> tags = new HashSet<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        if (id == null) id = UUID.randomUUID();
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
        if (currentStatus == null) currentStatus = ApplicationStatus.DRAFT;
        if (source == null) source = ApplicationSource.OTHER;
        if (appliedAt == null) appliedAt = LocalDate.now();
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    // ---- Getters / setters ----
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }

    public String getPosition() { return position; }
    public void setPosition(String position) { this.position = position; }

    public String getJobUrl() { return jobUrl; }
    public void setJobUrl(String jobUrl) { this.jobUrl = jobUrl; }

    public ApplicationSource getSource() { return source; }
    public void setSource(ApplicationSource source) { this.source = source; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public boolean isRemote() { return remote; }
    public void setRemote(boolean remote) { this.remote = remote; }

    public BigDecimal getSalaryMin() { return salaryMin; }
    public void setSalaryMin(BigDecimal salaryMin) { this.salaryMin = salaryMin; }

    public BigDecimal getSalaryMax() { return salaryMax; }
    public void setSalaryMax(BigDecimal salaryMax) { this.salaryMax = salaryMax; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public LocalDate getAppliedAt() { return appliedAt; }
    public void setAppliedAt(LocalDate appliedAt) { this.appliedAt = appliedAt; }

    public ApplicationStatus getCurrentStatus() { return currentStatus; }
    public void setCurrentStatus(ApplicationStatus currentStatus) { this.currentStatus = currentStatus; }

    public Instant getNextFollowUpAt() { return nextFollowUpAt; }
    public void setNextFollowUpAt(Instant nextFollowUpAt) { this.nextFollowUpAt = nextFollowUpAt; }

    public boolean isArchived() { return archived; }
    public void setArchived(boolean archived) { this.archived = archived; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public Set<String> getTags() { return tags; }
    public void setTags(Set<String> tags) { this.tags = tags == null ? new HashSet<>() : tags; }

    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
