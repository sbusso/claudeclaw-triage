#!/bin/bash
# Post-uninstall hook for claudeclaw-triage
# $1 = ClaudeClaw root directory
ROOT="${1:-.}"
rm -rf "$ROOT/skills/triage" "$ROOT/skills/swe"
rm -f "$ROOT/agents/triage.md" "$ROOT/agents/swe.md"
rm -rf "$ROOT/agent/skills/ticket-triage" "$ROOT/agent/skills/swe-agent"
echo "claudeclaw-triage: removed skills, agents, and agent skills"
