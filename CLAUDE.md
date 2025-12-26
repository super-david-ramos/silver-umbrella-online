# Project Configuration

This project uses [Superpowers](https://github.com/obra/superpowers) - a complete software development workflow built on composable skills.

## Submodule Setup

The superpowers skills are included as a git submodule. At the start of each session:

1. **Check if initialized:** `ls superpowers/skills/` - if empty, run step 2
2. **Initialize:** `git submodule update --init --recursive`
3. **Refresh periodically:** `git submodule update --remote --merge` (pulls latest updates)

Do this automatically when skills files are missing - don't ask the user.

## Skills

The following skills are available in `superpowers/skills/`. **Check for applicable skills BEFORE any response.**

### Core Workflow Skills

- **using-superpowers** - Start here. Establishes how to find and use skills.
  - @superpowers/skills/using-superpowers/SKILL.md

- **brainstorming** - Activates before writing code. Refines ideas through questions, explores alternatives.
  - @superpowers/skills/brainstorming/SKILL.md

- **writing-plans** - Creates detailed implementation plans with bite-sized tasks.
  - @superpowers/skills/writing-plans/SKILL.md

- **executing-plans** - Executes plans in batches with human checkpoints.
  - @superpowers/skills/executing-plans/SKILL.md

- **subagent-driven-development** - Fast iteration with two-stage review (spec compliance, then code quality).
  - @superpowers/skills/subagent-driven-development/SKILL.md

### Development Skills

- **test-driven-development** - RED-GREEN-REFACTOR cycle. Write failing test first, then minimal code.
  - @superpowers/skills/test-driven-development/SKILL.md

- **systematic-debugging** - 4-phase root cause process for debugging issues.
  - @superpowers/skills/systematic-debugging/SKILL.md

- **verification-before-completion** - Ensure fixes are actually working before declaring success.
  - @superpowers/skills/verification-before-completion/SKILL.md

### Collaboration Skills

- **requesting-code-review** - Pre-review checklist and process.
  - @superpowers/skills/requesting-code-review/SKILL.md

- **receiving-code-review** - Responding to feedback appropriately.
  - @superpowers/skills/receiving-code-review/SKILL.md

- **dispatching-parallel-agents** - Concurrent subagent workflows.
  - @superpowers/skills/dispatching-parallel-agents/SKILL.md

### Git Workflow Skills

- **using-git-worktrees** - Parallel development branches with isolated workspaces.
  - @superpowers/skills/using-git-worktrees/SKILL.md

- **finishing-a-development-branch** - Merge/PR decision workflow and cleanup.
  - @superpowers/skills/finishing-a-development-branch/SKILL.md

### Meta Skills

- **writing-skills** - Create new skills following best practices.
  - @superpowers/skills/writing-skills/SKILL.md

## Philosophy

- **Test-Driven Development** - Write tests first, always
- **Systematic over ad-hoc** - Process over guessing
- **Complexity reduction** - Simplicity as primary goal
- **Evidence over claims** - Verify before declaring success

## Testing Sandbox

The project includes a non-authenticated testing sandbox (`/sandbox.html`) for manual feature testing.

**Important:** When implementing new features or bug fixes, update the sandbox UI to include the new functionality. Prefer updating existing sandbox code over creating new test pages.

## Usage

When starting any task:
1. Check if any skill applies (even 1% chance means use it)
2. Read the skill file for guidance
3. Follow the skill's process exactly

Skills are mandatory workflows, not suggestions.
