"""Append-only audit store."""

from pathlib import Path
from typing import Any


class AuditStore:
    """Immutable, append-only record logger."""

    def __init__(self, path: Path | str):
        raise NotImplementedError("phase 01")

    def append(self, event: dict[str, Any]) -> None:
        """Appends a single JSON record to disk."""
        raise NotImplementedError("phase 01")

    def read_all(self) -> list[dict[str, Any]]:
        """Reads all records."""
        raise NotImplementedError("phase 01")
