@echo off
cd /d %~dp0
node node_modules/tsx/dist/cli.mjs watch src/index.ts
