---
title: Declare explicit project in .ai-memory.toml to avoid ambiguous scope
author: Rhuan
date: 2026-11-05
branch: main
cost: { minutes: 29, tokens: 908379 }
id: l-ec5a49ed
scope: repo
status: active
src: agent
touches:
  - ".ai-memory.toml"
---

Decided
Each repo's .ai-memory.toml now declares an explicit project = <exact ai-memory name> alongside workspace = "github-rhuan". Without project, ai-memory derived the project from git origin (rhuanssauro/<repo> -> key rhuanssauro-<repo>), which collided when that key was both a project name and another project's canonical key (e.g. rhuanssauro-sigma-rhuan = name of one project and canonical key of sigma-rhuan), causing "project is ambiguous ... 400 Bad Request".

Tried and ruled out
- Leaving project unset and deriving from remote: rejected, causes ambiguity errors.
- Naming project after the folder name for every repo: rejected, inconsistent with actual ai-memory project names (some are rhuanssauro-<folder>, some rhuanssauro-rhuanssauro-<folder>). Each name was verified via memory_status -> resolved_by "explicit".

Watch out
- rhuanssauro-labs push needed a rebase (remote was ahead); pre-existing unrelated unstaged changes were stashed and restored.
- rhuan-lab change is committed locally but cannot push: GitHub requires PR on main; needs a PR or relaxed branch protection.
- Four repos have no ai-memory project at all (decision-models-amd64-cuda, decision-models-silicon-mlx, rhuanssauro-code-reviewer, strong-professor-masterclasses); markers left unchanged.

In the code:
. ai-memory.toml edited in 22 repos under /Users/rhuann/projects/personal/Github-rhuan/
  - one line added: project = "<verified ai-memory project name>"
  - rhuan-social-media corrected to project = "rhuanssauro-rhuan-social-media" (the folder-name value was itself ambiguous)
  - verified each via MCP memory_status(workspace="github-rhuan", project=<name>) -> resolved_by "explicit"
  - committed and pushed in 20 repos; rhuan-lab committed locally only
