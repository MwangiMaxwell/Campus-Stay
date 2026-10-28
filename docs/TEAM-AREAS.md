# Team areas

Five members share this repository. Each row is the owner who should review changes in that path. GitHub names in `.github/CODEOWNERS` are placeholders. Replace them with real usernames before you rely on automatic review requests.

| Member | Role                                 | Primary paths                                                                         | Also reviews                                          |
| ------ | ------------------------------------ | ------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| 1      | Project manager and business analyst | `docs/`, root guides, the changelog                                                   | Scope changes in any folder                           |
| 2      | Database designer                    | `backend/src/models`, `backend/scripts/seed.ts`, `docs/03-DATABASE-DESIGN.md`         | Any new index or field                                |
| 3      | Front-end developer                  | `frontend/`                                                                           | API response shape when a screen needs a new field    |
| 4      | Back-end developer                   | `backend/src` routes, controllers, services, middleware, validators, security helpers | `docs/04-API-SPECIFICATION.md`, `docs/06-SECURITY.md` |
| 5      | QA and documentation                 | `backend/tests`, `frontend/src/**/*.test.ts`, `docs/05-TEST-PLAN.md`, report services | Audit samples and the user manual screenshots         |

## How to find your work

Search the repo for your tag:

```bash
# PowerShell
rg "TODO\(member-3\)"

# macOS and Linux
rg 'TODO\(member-3\)'
```

| Tag              | Current unfinished work                                                             |
| ---------------- | ----------------------------------------------------------------------------------- |
| `TODO(member-1)` | Final user-manual wording and screenshots are described in `docs/08-USER-MANUAL.md` |
| `TODO(member-2)` | Extend `backend/scripts/seed.ts` when a new demo record is required                 |
| `TODO(member-3)` | Student pages and admin screens under `frontend/src/app`                            |
| `TODO(member-4)` | Booking, payment, M-Pesa, password reset, and admin write handlers                  |
| `TODO(member-5)` | Report endpoints and the admin reports page, plus new tests as features land        |

## Boundaries

- Member 3 does not query MongoDB from the browser. Call `/api/v1`.
- Member 4 does not change a page's layout to make an endpoint easier. Agree the JSON in the API spec first.
- Member 2 does not put HTTP status codes in models.
- Member 5 can add tests anywhere, and should ask the area owner before changing production code to make a test pass.
- Member 1 can edit docs directly. A behavior change still needs the owner of the code.

## Handover

If a member is away, Member 1 reassigns the `TODO` tag and the feature branch in the same commit that changes ownership. The old tag should not remain, or the search becomes wrong.
