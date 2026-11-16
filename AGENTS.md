
# Project Engineering Guidelines

## General principles
- Prioritize readable and maintainable code.
- Prefer simple solutions over unnecessary abstraction.
- Avoid code duplication.
- Follow existing architectural conventions unless
  there is a good reason to change them.
- Do not introduce unnecessary dependencies.

## Architecture
- Keep components modular.
- Separate business logic from presentation.
- Avoid unnecessary coupling between modules.
- Use clear interfaces between components.

## Code quality
- Use descriptive variable and function names.
- Keep functions focused on a single responsibility.
- Handle errors explicitly.
- Document non-obvious design decisions.

## Testing
- Write tests for new functionality.
- Preserve existing functionality during refactoring.
- Run relevant tests after every meaningful change.
- Never claim tests passed unless they were actually run.

## Agent behavior
- Inspect relevant files before modifying them.
- Explain the proposed approach before major changes.
- Avoid unrelated modifications.
- Never overwrite user work without permission.
- Summarize all modifications and verification results.
