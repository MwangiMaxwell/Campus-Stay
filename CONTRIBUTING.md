# Contributing to CampusStay

CampusStay is a five-person university project. Small, reviewed changes keep the skeleton stable while each member builds their area.

## Branches

| Branch                    | Purpose                                                                             |
| ------------------------- | ----------------------------------------------------------------------------------- |
| `main`                    | Release-ready history. Merge here only from `develop` when a milestone is accepted. |
| `develop`                 | Integration branch. Open pull requests against `develop`.                           |
| `feature/<member>-<task>` | One task for one member. Example: `feature/member-3-room-search`.                   |

Do not commit directly to `main` or `develop`.

## Pull requests

- Keep a pull request to one task. A review should take less than half an hour.
- Target `develop`.
- Fill in the pull request template.
- Ask the area owner for review. `.github/CODEOWNERS` maps folders to members. Replace the placeholder GitHub names before the first review cycle.
- Wait for one approval from someone other than the author.
- Squash or merge only after lint, typecheck, tests, and the build are green.

### Checklist

- [ ] The change matches the task and does not include unrelated edits
- [ ] `npm run lint`, `npm run typecheck`, and `npm run test` pass
- [ ] New behavior has a test, or the test plan explains why it does not
- [ ] Secrets stay in `.env`. Only `.env.example` is committed
- [ ] API or screen changes are reflected in `docs/`
- [ ] Unfinished work uses `TODO(member-N):` with the owner who will finish it
- [ ] UI changes include a screenshot or a short description of the click path

## Conventional commits

Use a short subject in the imperative mood:

```text
feat: add room price filter to the student search page
fix: reject a second active booking for the same room
docs: describe the M-Pesa callback
test: cover suspended account login
refactor: move payment totals into the report service
chore: update the seed hostel phone numbers
```

Common types: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `build`, `ci`.

## Code review

- Read the diff against the requirements, not only for style.
- Comment on correctness, security, and missing tests first.
- Be specific and respectful. Suggest a change, then say why.
- The author owns the resolution. Do not merge your own pull request without another member's approval.
- Leave drive-by refactors for a separate pull request.

## Local checks before you push

```bash
npm run lint
npm run typecheck
npm run test
```

Husky runs Prettier on staged files through lint-staged. If a hook fails, format the files and commit again. Do not skip hooks.

## Where to work

See [docs/TEAM-AREAS.md](docs/TEAM-AREAS.md) and [docs/10-CODING-STANDARDS.md](docs/10-CODING-STANDARDS.md). If your change crosses an area, talk to that owner before you open the pull request.
