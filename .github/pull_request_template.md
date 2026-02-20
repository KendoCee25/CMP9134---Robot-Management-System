# Pull Request

## Linked Issue
Closes # <!-- Add the GitHub Issue number this PR resolves -->

## Description
<!-- Briefly describe what this PR does and why -->

## Type of Change
- [ ] New feature (user story implementation)
- [ ] Bug fix
- [ ] Refactor
- [ ] Documentation
- [ ] Tests
- [ ] CI/CD / Configuration

---

## Definition of Done Checklist

### Code Quality
- [ ] Code compiles and runs without errors
- [ ] No hardcoded passwords, secrets, or API keys in code
- [ ] No debug `print` / `console.log` statements left in production code
- [ ] Code follows the project's OOP structure and design patterns

### Testing
- [ ] Unit tests written and passing for new/changed logic
- [ ] Integration tests pass (API endpoints respond correctly)
- [ ] Edge cases handled (e.g. invalid inputs, out-of-range coordinates)

### Security & RBAC
- [ ] Passwords are hashed with Bcrypt — never stored in plain text
- [ ] RBAC enforced: Viewers cannot issue commands, only Commanders can
- [ ] No sensitive user data exposed in API responses or logs

### Robot API & Error Handling
- [ ] Handles 503 connection dropouts gracefully (retry logic / visual indicator)
- [ ] UI does not crash or freeze under variable latency (0.1s–0.8s)
- [ ] Commands validated before sending (e.g. coordinates within 0–20 grid range)

### Accessibility (WCAG)
- [ ] Interactive elements (buttons, inputs) are keyboard accessible
- [ ] Sufficient colour contrast for status indicators
- [ ] Form fields have clear labels (no placeholder-only labelling)

### Mission Logging
- [ ] Every command is persisted to the database with timestamp, username, and command type
- [ ] Audit log is readable and accurate in the UI

### Containerisation (where applicable)
- [ ] `docker-compose up` builds and runs the application without errors
- [ ] No local-only paths or environment-specific config hardcoded

### Documentation
- [ ] README updated if setup steps changed
- [ ] Inline comments added for any complex logic

---

## Screenshots / Evidence (optional)
<!-- Add screenshots of UI changes or test output if relevant -->
