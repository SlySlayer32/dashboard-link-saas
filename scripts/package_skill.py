#!/usr/bin/env python3
"""
Skill Packaging Script
Validates and packages a skill into a distributable .skill file.
"""

import os
import sys
import argparse
import yaml
import zipfile
from pathlib import Path
from typing import Dict, List, Tuple


class ValidationError(Exception):
    """Custom exception for validation errors."""
    pass


class SkillValidator:
    """Validates skill structure and content."""
    
    def __init__(self, skill_path: Path):
        self.skill_path = skill_path
        self.skill_name = skill_path.name
        self.errors: List[str] = []
        self.warnings: List[str] = []
    
    def validate(self) -> Tuple[bool, List[str], List[str]]:
        """Run all validation checks."""
        try:
            self._validate_directory_exists()
            self._validate_skill_md_exists()
            self._validate_yaml_frontmatter()
            self._validate_skill_body()
            self._validate_resources()
            self._validate_naming_conventions()
        except ValidationError as e:
            self.errors.append(str(e))
        
        return len(self.errors) == 0, self.errors, self.warnings
    
    def _validate_directory_exists(self):
        """Check that skill directory exists."""
        if not self.skill_path.exists():
            raise ValidationError(f"Skill directory does not exist: {self.skill_path}")
        if not self.skill_path.is_dir():
            raise ValidationError(f"Path is not a directory: {self.skill_path}")
    
    def _validate_skill_md_exists(self):
        """Check that SKILL.md exists."""
        skill_md = self.skill_path / "SKILL.md"
        if not skill_md.exists():
            raise ValidationError("SKILL.md file is required but not found")
    
    def _validate_yaml_frontmatter(self):
        """Validate YAML frontmatter structure and content."""
        skill_md = self.skill_path / "SKILL.md"
        content = skill_md.read_text()
        
        # Check for frontmatter delimiters
        if not content.startswith('---'):
            raise ValidationError("SKILL.md must start with YAML frontmatter (---)")
        
        # Extract frontmatter
        parts = content.split('---', 2)
        if len(parts) < 3:
            raise ValidationError("SKILL.md must have closing --- for frontmatter")
        
        frontmatter_text = parts[1].strip()
        
        # Parse YAML
        try:
            frontmatter = yaml.safe_load(frontmatter_text)
        except yaml.YAMLError as e:
            raise ValidationError(f"Invalid YAML frontmatter: {e}")
        
        # Check required fields
        if not isinstance(frontmatter, dict):
            raise ValidationError("Frontmatter must be a YAML dictionary")
        
        if 'name' not in frontmatter:
            raise ValidationError("Frontmatter must include 'name' field")
        
        if 'description' not in frontmatter:
            raise ValidationError("Frontmatter must include 'description' field")
        
        # Validate name matches directory
        if frontmatter['name'] != self.skill_name:
            self.warnings.append(
                f"Frontmatter name '{frontmatter['name']}' doesn't match "
                f"directory name '{self.skill_name}'"
            )
        
        # Validate description quality
        description = frontmatter['description']
        if not description or len(description.strip()) < 20:
            self.errors.append(
                "Description is too short (min 20 characters). "
                "Be comprehensive about what the skill does and when to use it."
            )
        
        if 'TODO' in description:
            self.errors.append("Description contains TODO - must be completed")
        
        # Check for extra fields (warning only)
        allowed_fields = {'name', 'description'}
        extra_fields = set(frontmatter.keys()) - allowed_fields
        if extra_fields:
            self.warnings.append(
                f"Frontmatter contains extra fields (will be ignored): {extra_fields}"
            )
    
    def _validate_skill_body(self):
        """Validate the main SKILL.md body content."""
        skill_md = self.skill_path / "SKILL.md"
        content = skill_md.read_text()
        
        # Extract body (after frontmatter)
        parts = content.split('---', 2)
        if len(parts) < 3:
            return
        
        body = parts[2].strip()
        
        if not body:
            self.errors.append("SKILL.md body is empty")
            return
        
        # Check for TODOs
        if 'TODO' in body:
            self.warnings.append("SKILL.md contains TODO items - consider completing them")
        
        # Check minimum length
        if len(body) < 100:
            self.warnings.append(
                "SKILL.md body is very short - consider adding more guidance"
            )
        
        # Warn if too long
        if len(body) > 25000:  # ~5000 words
            self.warnings.append(
                "SKILL.md body is very long (>5000 words) - "
                "consider moving content to references/"
            )
    
    def _validate_resources(self):
        """Validate bundled resources."""
        # Check for common resource directories
        resource_dirs = ['scripts', 'references', 'assets']
        has_resources = False
        
        for dir_name in resource_dirs:
            dir_path = self.skill_path / dir_name
            if dir_path.exists() and dir_path.is_dir():
                # Check if directory has any files (ignore .gitkeep)
                files = [f for f in dir_path.rglob('*') 
                        if f.is_file() and f.name != '.gitkeep']
                if files:
                    has_resources = True
                    
                    # Validate example files are removed
                    for f in files:
                        if 'example' in f.name.lower():
                            self.warnings.append(
                                f"Found example file that should be removed or renamed: {f.relative_to(self.skill_path)}"
                            )
        
        if not has_resources:
            self.warnings.append(
                "No bundled resources found (scripts, references, or assets). "
                "Consider if this skill would benefit from them."
            )
    
    def _validate_naming_conventions(self):
        """Validate skill naming follows conventions."""
        # Skill name should be lowercase with hyphens
        if not self.skill_name.islower():
            self.warnings.append(
                f"Skill name '{self.skill_name}' should be lowercase"
            )
        
        if '_' in self.skill_name:
            self.warnings.append(
                f"Skill name '{self.skill_name}' should use hyphens, not underscores"
            )
        
        # Check for spaces
        if ' ' in self.skill_name:
            self.errors.append(
                f"Skill name '{self.skill_name}' cannot contain spaces"
            )


class SkillPackager:
    """Packages a validated skill into a .skill file."""
    
    def __init__(self, skill_path: Path, output_dir: Path):
        self.skill_path = skill_path
        self.skill_name = skill_path.name
        self.output_dir = output_dir
    
    def package(self) -> Path:
        """Create a .skill package file."""
        # Ensure output directory exists
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Create package filename
        package_path = self.output_dir / f"{self.skill_name}.skill"
        
        # Create zip file with .skill extension
        with zipfile.ZipFile(package_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            # Add all files from skill directory
            for file_path in self.skill_path.rglob('*'):
                if file_path.is_file():
                    # Calculate archive name (relative to skill directory)
                    arcname = file_path.relative_to(self.skill_path)
                    zipf.write(file_path, arcname)
        
        return package_path


def main():
    parser = argparse.ArgumentParser(
        description="Validate and package a skill into a .skill file"
    )
    parser.add_argument(
        "skill_path",
        type=Path,
        help="Path to the skill directory"
    )
    parser.add_argument(
        "output_dir",
        type=Path,
        nargs='?',
        default=None,
        help="Output directory for .skill file (default: same as skill directory)"
    )
    
    args = parser.parse_args()
    
    # Default output directory
    if args.output_dir is None:
        args.output_dir = args.skill_path.parent
    
    # Validate skill
    print(f"🔍 Validating skill: {args.skill_path.name}")
    print("=" * 60)
    
    validator = SkillValidator(args.skill_path)
    is_valid, errors, warnings = validator.validate()
    
    # Display warnings
    if warnings:
        print("\n⚠️  Warnings:")
        for warning in warnings:
            print(f"  - {warning}")
    
    # Display errors
    if errors:
        print("\n❌ Errors:")
        for error in errors:
            print(f"  - {error}")
        print("\n❌ Validation failed. Fix errors and try again.")
        sys.exit(1)
    
    print("\n✅ Validation passed!")
    
    # Package skill
    print(f"\n📦 Packaging skill...")
    packager = SkillPackager(args.skill_path, args.output_dir)
    package_path = packager.package()
    
    print(f"\n✅ Skill packaged successfully!")
    print(f"📁 Package location: {package_path}")
    print(f"📊 Package size: {package_path.stat().st_size / 1024:.2f} KB")
    
    # Show next steps
    print(f"\n📝 Next steps:")
    print(f"1. Test the skill by loading it into your agent")
    print(f"2. Share the .skill file: {package_path}")
    print(f"3. Iterate based on usage feedback")


if __name__ == "__main__":
    main()
