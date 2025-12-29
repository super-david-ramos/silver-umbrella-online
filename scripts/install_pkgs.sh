#!/bin/bash
# SessionStart hook: Initialize submodules and install dependencies

# Initialize git submodules (superpowers, reference-impl)
git submodule update --init --recursive

# Install bun dependencies
bun install

exit 0
