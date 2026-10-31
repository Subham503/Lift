import pytest

from core.audit.store import AuditStore


def test_roundtrip_order(tmp_path):
    s = AuditStore(tmp_path / "a.jsonl")
    s.append({"n": 1})
    s.append({"n": 2})
    assert s.read_all() == [{"n": 1}, {"n": 2}]


def test_reopen_does_not_truncate(tmp_path):
    p = tmp_path / "a.jsonl"
    AuditStore(p).append({"n": 1})
    s2 = AuditStore(p)
    s2.append({"n": 2})
    assert s2.read_all() == [{"n": 1}, {"n": 2}]


def test_creates_parent_dirs(tmp_path):
    s = AuditStore(tmp_path / "x" / "y" / "a.jsonl")
    s.append({"ok": True})
    assert s.read_all() == [{"ok": True}]


def test_non_dict_rejected(tmp_path):
    s = AuditStore(tmp_path / "a.jsonl")
    with pytest.raises(TypeError):
        s.append(["no"])  # type: ignore[arg-type]


def test_bad_event_writes_nothing(tmp_path):
    p = tmp_path / "a.jsonl"
    s = AuditStore(p)
    s.append({"n": 1})
    before = p.read_bytes()
    with pytest.raises(ValueError):
        s.append({"x": float("nan")})
    with pytest.raises(TypeError):
        s.append({"x": object()})
    assert p.read_bytes() == before


def test_newline_in_value_stays_one_line(tmp_path):
    p = tmp_path / "a.jsonl"
    s = AuditStore(p)
    s.append({"msg": "a\nb", "u": "caf\u00e9"})
    assert len(p.read_bytes().splitlines()) == 1
    assert s.read_all() == [{"msg": "a\nb", "u": "caf\u00e9"}]


def test_same_event_same_bytes(tmp_path):
    a, b = tmp_path / "a.jsonl", tmp_path / "b.jsonl"
    AuditStore(a).append({"b": 1, "a": 2})
    AuditStore(b).append({"a": 2, "b": 1})
    assert a.read_bytes() == b.read_bytes()


def test_corrupt_line_raises(tmp_path):
    p = tmp_path / "a.jsonl"
    s = AuditStore(p)
    s.append({"n": 1})
    with open(p, "ab") as f:
        f.write(b'{"n":\n')
    with pytest.raises(ValueError, match="line 2"):
        s.read_all()


def test_no_mutating_api():
    for name in ("delete", "update", "clear", "truncate", "remove", "rewrite"):
        assert not hasattr(AuditStore, name)
