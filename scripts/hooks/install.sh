#!/usr/bin/env bash
# === 1. KONSTANTEN ===
# Install the pre-commit hook for this repo.
# Run once per clone: bash scripts/hooks/install.sh
set -euo pipefail
REPO_ROOT="$(git rev-parse --show-toplevel)"
HOOKS_DIR="$REPO_ROOT/.git/hooks"
SOURCE="$REPO_ROOT/scripts/hooks/pre-commit"
TARGET="$HOOKS_DIR/pre-commit"

# === 2. INSTALL ===
mkdir -p "$HOOKS_DIR"
if [ -e "$TARGET" ] && [ ! -L "$TARGET" ]; then
  cp "$TARGET" "$TARGET.backup_$(date +%Y%m%d_%H%M%S)"
  echo "Existing pre-commit backed up."
fi
ln -sf "$SOURCE" "$TARGET"
chmod +x "$SOURCE"
echo "Pre-commit hook installed: $TARGET -> $SOURCE"
