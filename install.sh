#!/usr/bin/env bash
# Install the docs CLI and link the docs-react skill into each agent CLI's skills directory.
#
#   ./install.sh                  CLI + links in ~/.agents/skills, ~/.claude/skills, ~/.gemini/config/skills
#   ./install.sh --project DIR    CLI + links in DIR/.agents/skills and DIR/.claude/skills
#   ./install.sh --uninstall      remove what this script installed (combine with --project DIR)
#   ./install.sh --dry-run        print the actions without changing anything
#   ./install.sh --no-cli         links only
#
# Idempotent. Creates symlinks to this checkout only (the CLI as ~/.local/bin/docs); never replaces
# an existing file or directory. The CLI needs Node 18 or newer and no npm install.
set -eu

REPO=$(cd "$(dirname "$0")" && pwd -P)
SKILL="$REPO/skills/docs-react"
LAUNCHER="$REPO/bin/docs.mjs"
BIN="$HOME/.local/bin/docs"

mode=install
dry=0
project=
skip_cli=0

usage() { sed -n '2,11p' "$0" | sed 's/^# \{0,1\}//'; }

while [ $# -gt 0 ]; do
  case "$1" in
    --uninstall) mode=uninstall ;;
    --dry-run) dry=1 ;;
    --no-cli) skip_cli=1 ;;
    --project)
      [ $# -ge 2 ] || { echo "error: --project needs a directory" >&2; exit 1; }
      project=$2
      shift
      ;;
    --project=*) project=${1#--project=} ;;
    -h | --help) usage; exit 0 ;;
    *) echo "error: unknown option: $1" >&2; usage >&2; exit 1 ;;
  esac
  shift
done

[ -f "$SKILL/SKILL.md" ] || { echo "error: $SKILL/SKILL.md not found; run from a docs-react checkout" >&2; exit 1; }
[ -n "${HOME:-}" ] || { echo "error: HOME is not set" >&2; exit 1; }

if [ -n "$project" ]; then
  [ -d "$project" ] || { echo "error: project directory not found: $project" >&2; exit 1; }
  project=$(cd "$project" && pwd -P)
  LINKS=("$project/.agents/skills/docs-react" "$project/.claude/skills/docs-react")
else
  LINKS=("$HOME/.agents/skills/docs-react" "$HOME/.claude/skills/docs-react" "$HOME/.gemini/config/skills/docs-react")
fi

status=0
prefix=
[ "$dry" = 1 ] && prefix="would "
say() { printf '%s%s\n' "$prefix" "$*"; }

# link PATH TARGET: create or repair one symlink; never replaces a real file or directory.
link() {
  local path=$1 target=$2 current
  if [ -L "$path" ]; then
    current=$(readlink "$path")
    if [ "$current" = "$target" ]; then
      printf 'ok    %s (already linked)\n' "$path"
      return
    fi
    say "link  $path -> $target (was -> $current)"
    [ "$dry" = 1 ] || { rm -f "$path" && ln -s "$target" "$path"; }
  elif [ -e "$path" ]; then
    printf 'skip  %s exists and is not a symlink; remove it to link this checkout\n' "$path" >&2
    status=1
  else
    say "link  $path -> $target"
    [ "$dry" = 1 ] || { mkdir -p "$(dirname "$path")" && ln -s "$target" "$path"; }
  fi
}

# unlink_ours PATH TARGET: remove the symlink only when it points at TARGET.
unlink_ours() {
  local path=$1 target=$2
  if [ -L "$path" ] && [ "$(readlink "$path")" = "$target" ]; then
    say "rm    $path"
    [ "$dry" = 1 ] || rm -f "$path"
  elif [ -e "$path" ] || [ -L "$path" ]; then
    printf 'skip  %s does not point at this checkout\n' "$path" >&2
  else
    printf 'ok    %s (absent)\n' "$path"
  fi
}

if [ "$mode" = install ]; then
  if [ "$skip_cli" = 0 ]; then
    command -v node >/dev/null 2>&1 || printf 'note  the docs CLI needs node 18 or newer on PATH\n' >&2
    link "$BIN" "$LAUNCHER"
    case ":$PATH:" in *":$HOME/.local/bin:"*) ;; *) printf 'note  add ~/.local/bin to PATH to run docs\n' >&2 ;; esac
  fi
  for path in "${LINKS[@]}"; do link "$path" "$SKILL"; done
else
  for path in "${LINKS[@]}"; do unlink_ours "$path" "$SKILL"; done
  [ "$skip_cli" = 1 ] || unlink_ours "$BIN" "$LAUNCHER"
fi
exit $status
