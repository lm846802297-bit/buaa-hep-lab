"""Teaching benchmark v0.1: X -> a b for three distinct real scalars.

Units: hbar=c=1; masses and g in GeV; L_int=-g X a b; tree level.
No experimental inputs, loops, spin, detector model or Higgs identification.
Reference: PDG Kinematics (2025), sections 49.4 and 49.4.2.
https://pdg.lbl.gov/2025/reviews/rpp2025-rev-kinematics.pdf
Run: python two_body_decay.py (Python 3.9+, standard library only).
Checks: analytic limits and a separate angular quadrature implementation.
This is implementation consistency evidence, not independent research validation.
"""
import json
import math
import platform


def width(mass, first, second, coupling):
    values = (mass, first, second, coupling)
    if not all(math.isfinite(v) for v in values):
        raise ValueError("Inputs must be finite")
    if mass <= 0 or first < 0 or second < 0:
        raise ValueError("M must be positive; daughter masses must be nonnegative")
    if mass <= first + second:
        return 0.0
    momentum = math.sqrt((mass-first-second)*(mass+first+second)
                         *(mass-first+second)*(mass+first-second)) / (2*mass)
    return coupling**2 * momentum / (8*math.pi*mass**2)


def angular_quadrature(mass, first, second, coupling, bins=400):
    # Independent route: solve E1+E2=M by bisection, then integrate dGamma/dOmega.
    if mass <= first + second:
        return 0.0
    lo, hi = 0.0, mass/2
    for _ in range(120):
        p = (lo+hi)/2
        if math.hypot(p, first)+math.hypot(p, second) > mass:
            hi = p
        else:
            lo = p
    momentum = (lo+hi)/2
    density = coupling**2 * momentum / (32*math.pi**2*mass**2)
    # Midpoint quadrature over cos(theta) and analytic azimuthal integration.
    return math.fsum(density*2*math.pi*(2/bins) for _ in range(bins))


def run_checks():
    passed = []

    def close(actual, expected, label):
        if not math.isclose(actual, expected, rel_tol=1e-10, abs_tol=1e-14):
            raise AssertionError(f"{label}: {actual} != {expected}")
        passed.append(label)

    close(width(10, 0, 0, 1), 1/(160*math.pi), "massless analytic limit")
    close(width(10, 4, 6, 1), 0, "exact threshold")
    close(width(10, 5, 6, 1), 0, "forbidden decay")
    close(width(10, 1, 3, 1), width(10, 3, 1, 1), "daughter exchange")
    close(width(10, 1, 3, 2), 4*width(10, 1, 3, 1), "coupling squared")
    close(width(20, 2, 6, 2), 2*width(10, 1, 3, 1), "mass dimension one")
    close(width(10, 1, 3, 0), 0, "zero coupling")
    for point in [(10, 0, 0, 1), (10, 1, 3, 1), (10, 4, 5.999, 2), (1, .2, .3, .1)]:
        close(width(*point), angular_quadrature(*point), f"angular quadrature {point}")
    for point in [(-1, 0, 0, 1), (0, 0, 0, 1), (1, -1, 0, 1), (1, 0, 0, math.nan), (1, 0, 0, math.inf)]:
        try:
            width(*point)
        except ValueError:
            passed.append(f"invalid input rejected {point}")
        else:
            raise AssertionError(f"Accepted invalid input {point}")
    return passed


if __name__ == "__main__":
    checks = run_checks()
    print(json.dumps({"example": "distinct scalar two-body decay", "version": "0.1",
                      "python": platform.python_version(), "units": "GeV",
                      "benchmark_inputs": {"M": 10, "m1": 1, "m2": 3, "g": 1},
                      "width_GeV": width(10, 1, 3, 1),
                      "checks_passed": len(checks), "checks": checks}, indent=2))
