#!/bin/bash
# Post-install hook for claudeclaw-triage
# $1 = ClaudeClaw root directory
ROOT="${1:-.}"

# Copy skills
[ -d "$(dirname "$0")/../skills/triage" ] && cp -r "$(dirname "$0")/../skills/triage" "$ROOT/skills/"
[ -d "$(dirname "$0")/../skills/swe" ] && cp -r "$(dirname "$0")/../skills/swe" "$ROOT/skills/"

# Copy agent prompts
[ -f "$(dirname "$0")/../agents/triage.md" ] && cp "$(dirname "$0")/../agents/triage.md" "$ROOT/agents/"
[ -f "$(dirname "$0")/../agents/swe.md" ] && cp "$(dirname "$0")/../agents/swe.md" "$ROOT/agents/"

# Copy agent skills
[ -d "$(dirname "$0")/../agent/skills/ticket-triage" ] && cp -r "$(dirname "$0")/../agent/skills/ticket-triage" "$ROOT/agent/skills/"
[ -d "$(dirname "$0")/../agent/skills/swe-agent" ] && cp -r "$(dirname "$0")/../agent/skills/swe-agent" "$ROOT/agent/skills/"

echo "claudeclaw-triage: installed skills, agents, and agent skills"
