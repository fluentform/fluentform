# Coverage Plan — Codeception (wp-browser) harness

> Source: [fluentform#1007](https://github.com/fluentform/fluentform/pull/1007). Regenerate the numbers with `./wpf coverage:status`.

## Stage 1 — Module-wise coverage baseline

The harness (#1007) establishes a per-module coverage baseline so every area has a tracked number before/after 6.3.0 work lands.

**Overall: 15.3%** (1493 / 9755 statements).

| Feature area | Namespace | Coverage | Covered / Total |
|--------------|-----------|---------:|----------------:|
| REST API | Api | 52.8% | 93 / 176 |
| Compatibility | Compat | 42.9% | 3 / 7 |
| Helpers / Utilities | Helpers | 12.8% | 117 / 912 |
| Hooks / Actions | Hooks | 6.4% | 80 / 1256 |
| HTTP Routing | Http | 100% | 115 / 115 |
| Controllers | Http/Controllers | 4.1% | 4 / 97 |
| Permissions / Policies | Http/Policies | 40% | 6 / 15 |
| Data Models | Models | 7.5% | 96 / 1281 |
| Access Control | Modules/Acl | 8.5% | 17 / 201 |
| Form Components / Fields | Modules/Component | 1.8% | 18 / 1003 |
| Form Builder (core) | Modules/Form | 15.9% | 55 / 345 |
| Submission Handler | Modules/SubmissionHandler | 100% | 9 / 9 |
| Browser / Device Detection | Services/Browser | 30.7% | 227 / 740 |
| Conditional Logic | Services/ConditionAssesor.php | 2.3% | 3 / 128 |
| Conversational Forms | Services/FluentConversational | 1% | 1 / 100 |
| Form Services | Services/Form | 24.1% | 422 / 1752 |
| Form Builder (rendering) | Services/FormBuilder | 3.7% | 26 / 704 |
| Integrations | Services/Integrations | 6.2% | 4 / 65 |
| Manager | Services/Manager | 12.8% | 6 / 47 |
| SmartCode / Parser | Services/Parser | 48.3% | 173 / 358 |
| Submissions / Entries | Services/Submission | 4.1% | 18 / 444 |

## Wave 2 — biggest gaps to close next

| Feature area | Namespace | Coverage |
|--------------|-----------|---------:|
| Form Components / Fields | Modules/Component | 1.8% |
| Conversational Forms | Services/FluentConversational | 1% |
| Conditional Logic | Services/ConditionAssesor.php | 2.3% |
| Form Builder (rendering) | Services/FormBuilder | 3.7% |
| Controllers | Http/Controllers | 4.1% |
| Submissions / Entries | Services/Submission | 4.1% |

## Subsequent steps

- Sandbox guard — landed (fail-closed `GuardAgainstProductionDb`).
- CI wiring.
- Per-PR coverage gate (coverage not decreased).
