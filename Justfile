set windows-shell := ["powershell.exe", "-NoLogo", "-Command"]

# === Modes ===

# Pre-commit: fast checks (~10-30s)
ci-fast: hygiene fmt lint build test-quick

# Pre-push: exhaustive checks (~5-15min)
ci-deep: ci-fast test-full coverage security docs

# === Repo Hygiene ===
hygiene:
    bash scripts/hygiene.sh

# === Rust Recipes ===
fmt:
    cargo fmt --check

lint:
    cargo clippy --all-targets --all-features -- -D warnings
    cargo machete

build:
    cargo build --all-targets --all-features --locked

test-quick:
    cargo nextest run --locked

test-full:
    cargo nextest run --all-features --locked

coverage:
    $coverage_threshold = if ($env:CI_COVERAGE_MIN_REGIONS) { $env:CI_COVERAGE_MIN_REGIONS } else { '73' }; cargo llvm-cov nextest --all-features --fail-under-regions $coverage_threshold --lcov --output-path lcov.info

security:
    cargo deny check
    cargo audit
    python scripts/enforce_advisory_policy.py

docs:
    $env:RUSTDOCFLAGS = "-D warnings"; cargo doc --no-deps --all-features

# === Optional ===
vendor:
    cargo vendor
    @echo 'Add [source.crates-io] replace-with = "vendored" to .cargo/config.toml'

bench:
    cargo bench --locked

clean:
    cargo clean

# === Frontend (uncomment for mixed projects) ===
# fmt-frontend:
#     pnpm prettier --check .
# lint-frontend:
#     pnpm eslint .
# test-frontend:
#     pnpm vitest run

# === Python (uncomment for Python projects) ===
# fmt-python:
#     uv run ruff format --check .
# lint-python:
#     uv run ruff check .
# test-python:
#     uv run pytest
