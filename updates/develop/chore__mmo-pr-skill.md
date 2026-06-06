# MMO PR Workflow

## Player-facing changes

- Added a reusable `/mmo_pr` workflow for preparing feature branches, changelog notes, and pull requests into `develop`.

## Technical notes

- Added matching Claude and Cursor instructions for creating branch-scoped changelog notes under `updates/develop/`.
- Updated release guidance so future releases fold `updates/develop/**/*` notes into the version changelog before deleting the folded notes.

## Validation

- ReadLints on the changed markdown files.
