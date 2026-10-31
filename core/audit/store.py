"""Append-only audit store."""

from __future__ import annotations

import json
import os
import threading
from pathlib import Path
from typing import Any


class AuditStore:
    """Immutable, append-only record logger (JSON Lines).

    One record = one line. File opens in append mode only. There is no
    delete, update, or rewrite method on purpose.
    """

    def __init__(self, path: Path | str, *, durable: bool = True):
        self._path = Path(path)
        if self._path.is_dir():
            raise ValueError(f"audit path is a directory: {self._path}")
        self._path.parent.mkdir(parents=True, exist_ok=True)
        self._durable = durable  # fsync every append. Pass False for bulk runs.
        self._lock = threading.Lock()
        with open(self._path, "ab"):  # create if missing, never truncate
            pass

    @property
    def path(self) -> Path:
        return self._path

    def append(self, event: dict[str, Any]) -> None:
        """Appends a single JSON record to disk."""
        if not isinstance(event, dict):
            raise TypeError("event must be a dict")
        # Serialize FIRST. A bad event raises before any byte is written.
        line = json.dumps(
            event,
            sort_keys=True,
            separators=(",", ":"),
            ensure_ascii=True,
            allow_nan=False,
        )
        data = (line + "\n").encode("ascii")
        with self._lock, open(self._path, "ab") as f:
            f.write(data)  # one write call per record
            f.flush()
            if self._durable:
                os.fsync(f.fileno())

    def read_all(self) -> list[dict[str, Any]]:
        """Reads all records."""
        if not self._path.exists():
            return []
        records: list[dict[str, Any]] = []
        with open(self._path, "rb") as f:
            for lineno, raw in enumerate(f, start=1):
                text = raw.decode("utf-8").strip()
                if not text:
                    continue
                try:
                    obj = json.loads(text)
                except json.JSONDecodeError as exc:
                    raise ValueError(f"corrupt audit record at line {lineno}") from exc
                if not isinstance(obj, dict):
                    raise ValueError(f"audit record at line {lineno} is not an object")
                records.append(obj)
        return records
