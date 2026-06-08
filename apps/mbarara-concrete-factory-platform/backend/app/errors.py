class DomainError(Exception):
    """Base class for expected business-rule failures."""

    status_code = 400


class NotFoundError(DomainError):
    status_code = 404


class BusinessRuleError(DomainError):
    status_code = 409


class ValidationRuleError(DomainError):
    status_code = 422

