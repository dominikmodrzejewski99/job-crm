package pl.dmod.crm.application.domain;

/**
 * Lifecycle states an application moves through. The order roughly reflects
 * forward progression but transitions are not strictly linear — an application
 * can be REJECTED or WITHDRAWN from any earlier state.
 */
public enum ApplicationStatus {
    DRAFT,
    APPLIED,
    ACK_RECEIVED,
    INTERVIEW_SCHEDULED,
    INTERVIEW_DONE,
    TASK_RECEIVED,
    TASK_SUBMITTED,
    OFFER,
    REJECTED,
    WITHDRAWN,
    GHOSTED;
}
