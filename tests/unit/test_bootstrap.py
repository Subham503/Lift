import numpy as np
import pytest

from core.eval.bootstrap import bootstrap_ci, evaluate_lift, paired_bootstrap_ci


def test_same_seed_same_ci():
    d = list(np.linspace(-1, 3, 20))
    assert paired_bootstrap_ci(d, seed=7) == paired_bootstrap_ci(d, seed=7)


def test_different_seed_differs():
    d = list(np.linspace(-1, 3, 20))
    assert paired_bootstrap_ci(d, seed=1) != paired_bootstrap_ci(d, seed=2)


def test_ci_brackets_mean():
    d = list(np.random.default_rng(0).normal(5, 2, 30))
    mean, lo, hi = paired_bootstrap_ci(d)
    assert lo <= mean <= hi


def test_constant_diffs_zero_width():
    mean, lo, hi = paired_bootstrap_ci([2.0] * 20)
    assert mean == lo == hi == 2.0


def test_single_seed_underpowered():
    assert evaluate_lift([1.0]).underpowered is True


@pytest.mark.parametrize("bad", [[], [1.0, float("nan")], [1.0, float("inf")]])
def test_bad_input_raises(bad):
    with pytest.raises(ValueError):
        evaluate_lift(bad)


def test_custom_stat_median():
    point, lo, hi = bootstrap_ci([1, 2, 3, 4, 100], stat_fn=np.median, n_resamples=500)
    assert point == 3.0 and lo <= point <= hi
