# Project plan

CampusStay is delivered in milestones that match a typical course sequence: proposal, design, implementation, test, and demo. Dates below are relative to a 12-week course. The project manager (Member 1) replaces the week numbers with the instructor's calendar.

## 1. Milestones

| Week | Milestone                              | Evidence                                                    |
| ---- | -------------------------------------- | ----------------------------------------------------------- |
| 1-2  | Proposal and SRS                       | `docs/01-SRS.md` accepted by the instructor                 |
| 3-4  | Architecture and database design       | `docs/02-ARCHITECTURE.md`, `docs/03-DATABASE-DESIGN.md`     |
| 5    | Skeleton, auth, and CI                 | This repository at 0.1.0. Register, login, and health work  |
| 6-7  | Room search UI and booking transaction | FR2 and FR3 demo, double-booking test still green           |
| 8-9  | M-Pesa sandbox payment                 | FR4 demo with a sandbox receipt                             |
| 10   | Admin actions and reports              | FR5 demo, including logo and date on a report               |
| 11   | Test and security pass                 | `docs/05-TEST-PLAN.md` cases checked, audit sample reviewed |
| 12   | User manual, deployment, final demo    | `docs/08-USER-MANUAL.md` and a hosted or local demo         |

## 2. Tasks

| Member | Role                                 | Tasks                                                                                                                  | Depends on                               |
| ------ | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| 1      | Project manager and business analyst | Keep the SRS current, run the weekly check, time the five-minute booking, finish the user manual, present the demo     | Design docs, then a working booking path |
| 2      | Database designer                    | Own models and indexes, extend the seed when new demo rows are needed, review any schema change                        | SRS field list                           |
| 3      | Front-end developer                  | Room search, booking form, payment screen, profile, and admin screens. Replace each `TODO(member-3)`                   | Working API or the agreed 501 contract   |
| 4      | Back-end developer                   | Booking rules, M-Pesa, admin writes, password reset, and the audit calls marked `TODO(member-4)`                       | Models and the API spec                  |
| 5      | QA and documentation                 | Extend tests as features land, review audit samples, build the three reports (`TODO(member-5)`), record the load check | Each feature branch before it merges     |

A task is done when the matching test in `docs/05-TEST-PLAN.md` passes and the pull request is approved by the area owner.

## 3. Ways of working

- Integration branch: `develop`. Release branch: `main`.
- One feature branch per task: `feature/member-4-stk-push`.
- Pull requests stay small. See `CONTRIBUTING.md`.
- Member 1 tracks blockers in the team chat and in GitHub issues using the task template.

## 4. Risk register

| ID  | Risk                                                        | Likelihood | Impact | Response                                                                                                  |
| --- | ----------------------------------------------------------- | ---------- | ------ | --------------------------------------------------------------------------------------------------------- |
| R1  | Atlas or Daraja credentials are committed                   | Medium     | High   | `.gitignore`, example files only, production secret check, review on every PR                             |
| R2  | Daraja callbacks cannot reach a laptop                      | High       | High   | Deploy the API, or use a tunnel, before the payment demo. Keep the handler a stub until the URL is public |
| R3  | Two members edit the booking model at once                  | Medium     | Medium | Member 2 owns `backend/src/models`. Others request a change                                               |
| R4  | The five-minute booking path is too long                    | Medium     | Medium | Member 1 times it in week 7 and Member 3 cuts steps                                                       |
| R5  | The in-memory test database hides an Atlas index difference | Low        | Medium | Run the booking index test once against Atlas before the demo                                             |
| R6  | A member is absent near a milestone                         | Medium     | High   | Tasks are greppable with `TODO(member-N)`. Member 1 reassigns the TODO and the branch                     |
| R7  | M-Pesa sandbox is down on demo day                          | Medium     | High   | Record a sandbox receipt earlier in the week and keep screenshots in the manual                           |
| R8  | Scope grows into rent collection or a mobile app            | Medium     | Medium | The SRS out-of-scope list is the answer. New scope needs the instructor's agreement                       |

## 5. Definition of done for 0.1.0

The skeleton milestone is done when a teammate can install, seed, register, log in, and run lint, typecheck, tests, and the build. Later milestones reuse that bar and add the requirement IDs they close.
