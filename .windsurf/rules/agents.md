---
trigger: model_decision
description: Ensures an agents.md file is created in every new folder with proper Windsurf Cascade guidelines  When creating a new folder, always create an agents.md file following these practices
---

1. **Create agents.md immediately after folder creation**
   - File must be named exactly `agents.md` or `AGENTS.md`
   - Place it in the root of the newly created folder
   - Use plain markdown format with no special frontmatter

2. **Basic agents.md structure**
   ```markdown
   # [Folder Name] Guidelines
   
   When working with files in this directory:
   
   ## Purpose
   [Brief description of this folder's purpose]
   
   ## Guidelines
   - [Specific guideline 1]
   - [Specific guideline 2]
   - [Add more as needed]
   
   ## File Structure
   [If applicable, describe expected file organization]
   ```

3. **Content guidelines**
   - Include the folder's purpose and what it contains
   - Provide specific coding patterns or conventions for this folder
   - List any required files or naming conventions
   - Include testing requirements if applicable
   - Add any folder-specific rules or best practices

4. **Location-based scoping**
   - The agents.md file will automatically apply only to files in its directory and subdirectories
   - This provides targeted guidance without affecting other parts of the project

5. **Example for a components folder**
   ```markdown
   # React Components
   
   When working with components in this directory:
   
   ## Purpose
   Contains reusable React components for the application
   
   ## Guidelines
   - Use functional components with TypeScript
   - Follow naming convention: ComponentName.tsx
   - Each component needs a corresponding test file
   - Use Tailwind CSS for styling
   
   ## File Structure
   Each component should include:
   - ComponentName.tsx (main component)
   - ComponentName.test.tsx (tests)
   - index.ts (exports)
   ```

Remember: The agents.md file should be helpful and specific to the folder's context. Don't create empty or generic files.
