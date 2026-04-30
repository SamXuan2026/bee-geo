#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$PROJECT_ROOT/env.sh"

cd "$PROJECT_ROOT/backend"
mvn -Dmaven.repo.local="$PROJECT_ROOT/.m2/repository" -DskipTests compile
