# MindBase Skill

A skill bundle that teaches an AI how to read and write your MindBase notes library.

## What's a "skill"?

A skill is a small folder with a `SKILL.md` that an AI agent loads as part of its context — so it knows how to operate a specific tool or service without you re-explaining every conversation.

This bundle works with any AI runtime that supports the [Anthropic Skills](https://docs.anthropic.com/en/docs/agents-and-tools/agent-skills) format (Claude Code, Anthropic-compatible agent frameworks, and other tools that load YAML-frontmatter `SKILL.md` files).

## Install

Drop the `mindbase/` folder into the host's skills directory. For example:

- Claude Code: `~/.claude/skills/mindbase/`
- Other agent frameworks: see their docs for the skill directory

## Use

1. Open `<your-mindbase>/ai`, enable AI authorization
2. Copy the prepared message and paste it into the chat
3. The AI picks up the base URL + Bearer token from your message and follows `SKILL.md` from there

## Files

- `SKILL.md` — instructions the AI reads to use the MindBase API
- `README.md` — this file
