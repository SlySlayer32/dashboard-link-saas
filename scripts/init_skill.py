#!/usr/bin/env python3
"""
Skill Initialization Script
Creates a new skill directory with proper structure and template files.
"""

import os
import sys
import argparse
from pathlib import Path


SKILL_TEMPLATE = """---
name: {skill_name}
description: TODO - Describe what this skill does and when to use it. This is the primary triggering mechanism - be comprehensive and clear about all use cases.
---

# {skill_title}

## Overview

TODO - Brief overview of what this skill provides

## When to Use This Skill

TODO - Specific scenarios and triggers for this skill (This is critical for skill activation)

## Workflow

TODO - Step-by-step instructions for using this skill

### Step 1: TODO

TODO - Detailed instructions

### Step 2: TODO

TODO - Detailed instructions

## Examples

TODO - Concrete examples of skill usage

## Resources

- **Scripts**: See `scripts/` directory for automation tools
- **References**: See `references/` directory for detailed documentation
- **Assets**: See `assets/` directory for templates and resources

## Common Pitfalls

TODO - Things to watch out for

## Best Practices

TODO - Recommended approaches
"""

EXAMPLE_SCRIPT = """#!/usr/bin/env python3
'''
Example script - Replace with your actual automation
'''

def main():
    print("Example script - customize for your skill's needs")

if __name__ == '__main__':
    main()
"""

EXAMPLE_REFERENCE = """# Example Reference Documentation

TODO - Replace with detailed reference material for this skill

## Section 1

Detailed information...

## Section 2

More detailed information...
"""

EXAMPLE_ASSET = """# Example Asset

This file represents a template or resource that will be used in the output.
Replace with your actual template/asset content.
"""


def create_skill_structure(skill_name: str, output_path: Path) -> None:
    """Create the skill directory structure with template files."""
    
    # Create main skill directory
    skill_dir = output_path / skill_name
    if skill_dir.exists():
        print(f"Error: Skill directory already exists: {skill_dir}")
        sys.exit(1)
    
    skill_dir.mkdir(parents=True, exist_ok=True)
    print(f"Created skill directory: {skill_dir}")
    
    # Create SKILL.md
    skill_title = skill_name.replace('-', ' ').title()
    skill_md_content = SKILL_TEMPLATE.format(
        skill_name=skill_name,
        skill_title=skill_title
    )
    skill_md_path = skill_dir / "SKILL.md"
    skill_md_path.write_text(skill_md_content)
    print(f"Created SKILL.md: {skill_md_path}")
    
    # Create subdirectories
    subdirs = ["scripts", "references", "assets"]
    for subdir in subdirs:
        subdir_path = skill_dir / subdir
        subdir_path.mkdir(exist_ok=True)
        print(f"Created directory: {subdir_path}")
    
    # Create example files
    example_script = skill_dir / "scripts" / "example.py"
    example_script.write_text(EXAMPLE_SCRIPT)
    example_script.chmod(0o755)
    print(f"Created example script: {example_script}")
    
    example_ref = skill_dir / "references" / "example.md"
    example_ref.write_text(EXAMPLE_REFERENCE)
    print(f"Created example reference: {example_ref}")
    
    example_asset = skill_dir / "assets" / "example-template.md"
    example_asset.write_text(EXAMPLE_ASSET)
    print(f"Created example asset: {example_asset}")
    
    # Create .gitkeep files for empty directories
    gitkeep = skill_dir / "scripts" / ".gitkeep"
    gitkeep.touch()
    
    print(f"\n✅ Skill '{skill_name}' initialized successfully!")
    print(f"📁 Location: {skill_dir}")
    print(f"\n📝 Next steps:")
    print(f"1. Edit {skill_md_path} and fill in the TODOs")
    print(f"2. Add your scripts to {skill_dir / 'scripts'}/")
    print(f"3. Add reference docs to {skill_dir / 'references'}/")
    print(f"4. Add assets/templates to {skill_dir / 'assets'}/")
    print(f"5. Delete example files you don't need")
    print(f"6. Run package_skill.py to validate and package the skill")


def main():
    parser = argparse.ArgumentParser(
        description="Initialize a new skill with proper structure"
    )
    parser.add_argument(
        "skill_name",
        help="Name of the skill (e.g., 'code-quality-reviewer')"
    )
    parser.add_argument(
        "--path",
        type=Path,
        default=Path.cwd() / ".github" / "skills",
        help="Output directory for the skill (default: .github/skills)"
    )
    
    args = parser.parse_args()
    
    # Validate skill name
    if not args.skill_name.replace('-', '').replace('_', '').isalnum():
        print("Error: Skill name should only contain letters, numbers, hyphens, and underscores")
        sys.exit(1)
    
    # Create skill structure
    create_skill_structure(args.skill_name, args.path)


if __name__ == "__main__":
    main()
