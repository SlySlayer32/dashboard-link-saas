from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from textwrap import wrap


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs" / "founder-app-one-pager.md"
OUTPUT = ROOT / "docs" / "founder-app-one-pager.pdf"

PAGE_WIDTH = 842
PAGE_HEIGHT = 595
MARGIN_X = 28
MARGIN_Y = 24
GUTTER = 14
HEADER_HEIGHT = 62
COLUMN_COUNT = 3
COLUMN_WIDTH = (PAGE_WIDTH - (MARGIN_X * 2) - (GUTTER * (COLUMN_COUNT - 1))) / COLUMN_COUNT
FONT_REGULAR = "F1"
FONT_BOLD = "F2"


@dataclass
class TextLine:
    text: str
    font: str
    size: int
    color: tuple[float, float, float]
    leading: int
    indent: int = 0


@dataclass
class Section:
    heading: str
    lines: list[TextLine] = field(default_factory=list)


def escape_pdf_text(value: str) -> str:
    return (
        value.replace("\\", "\\\\")
        .replace("(", "\\(")
        .replace(")", "\\)")
        .replace("\u2013", "-")
        .replace("\u2014", "-")
        .replace("\u2019", "'")
        .replace("\u201c", '"')
        .replace("\u201d", '"')
        .replace("\u2022", "-")
    )


def wrap_text(text: str, font_size: int, width: float, indent: int = 0) -> list[str]:
    usable_width = max(width - indent, 40)
    approx_char_width = max(font_size * 0.52, 1)
    max_chars = max(int(usable_width / approx_char_width), 12)
    return wrap(text, width=max_chars, break_long_words=False, break_on_hyphens=False) or [text]


def parse_markdown() -> tuple[str, list[str], list[Section]]:
    lines = SOURCE.read_text(encoding="utf-8").splitlines()
    if not lines or not lines[0].startswith("# "):
        raise ValueError("Source markdown must start with a level-1 heading.")

    title = lines[0][2:].strip()
    intro: list[str] = []
    sections: list[Section] = []
    current: Section | None = None
    before_first_section = True

    for raw_line in lines[1:]:
        line = raw_line.rstrip()
        if not line:
            continue

        if line.startswith("## "):
            before_first_section = False
            current = Section(heading=line[3:].strip())
            sections.append(current)
            continue

        if before_first_section:
            intro.append(line)
            continue

        if current is None:
            continue

        if line.startswith("- "):
            bullet_text = line[2:].strip()
            wrapped = wrap_text(bullet_text, 7, COLUMN_WIDTH - 8, indent=10)
            for index, piece in enumerate(wrapped):
                prefix = "- " if index == 0 else "  "
                current.lines.append(
                    TextLine(
                        text=f"{prefix}{piece}",
                        font=FONT_REGULAR,
                        size=7,
                        color=(0.16, 0.2, 0.28),
                        leading=8,
                    )
                )
        else:
            wrapped = wrap_text(line.strip(), 7, COLUMN_WIDTH)
            for piece in wrapped:
                current.lines.append(
                    TextLine(
                        text=piece,
                        font=FONT_REGULAR,
                        size=7,
                        color=(0.16, 0.2, 0.28),
                        leading=8,
                    )
                )

    return title, intro, sections


def section_height(section: Section) -> int:
    base = 16
    return base + sum(line.leading for line in section.lines) + 5


def build_content_stream(title: str, intro: list[str], sections: list[Section]) -> str:
    commands: list[str] = []

    def text(x: float, y: float, value: str, font: str, size: int, color: tuple[float, float, float]):
        commands.append(f"{color[0]:.3f} {color[1]:.3f} {color[2]:.3f} rg")
        commands.append(f"BT /{font} {size} Tf {x:.2f} {y:.2f} Td ({escape_pdf_text(value)}) Tj ET")

    def rect(x: float, y: float, width: float, height: float, color: tuple[float, float, float]):
        commands.append(f"{color[0]:.3f} {color[1]:.3f} {color[2]:.3f} rg")
        commands.append(f"{x:.2f} {y:.2f} {width:.2f} {height:.2f} re f")

    rect(0, PAGE_HEIGHT - HEADER_HEIGHT, PAGE_WIDTH, HEADER_HEIGHT, (0.94, 0.97, 1.0))
    rect(MARGIN_X, PAGE_HEIGHT - HEADER_HEIGHT + 12, 6, 30, (0.15, 0.33, 0.67))

    text(MARGIN_X + 16, PAGE_HEIGHT - 34, title, FONT_BOLD, 17, (0.09, 0.17, 0.31))

    subtitle_y = PAGE_HEIGHT - 50
    intro_text = " ".join(intro)
    for line in wrap_text(intro_text, 8, PAGE_WIDTH - (MARGIN_X * 2) - 24):
        text(MARGIN_X + 16, subtitle_y, line, FONT_REGULAR, 8, (0.27, 0.34, 0.43))
        subtitle_y -= 10

    column_x = [MARGIN_X + i * (COLUMN_WIDTH + GUTTER) for i in range(COLUMN_COUNT)]
    column_index = 0
    cursor_y = PAGE_HEIGHT - HEADER_HEIGHT - 14
    min_y = MARGIN_Y + 8

    for section in sections:
        needed_height = section_height(section)
        if cursor_y - needed_height < min_y:
            column_index += 1
            if column_index >= COLUMN_COUNT:
                raise ValueError("Content exceeds one page. Tighten the source markdown.")
            cursor_y = PAGE_HEIGHT - HEADER_HEIGHT - 18

        x = column_x[column_index]
        text(x, cursor_y, section.heading, FONT_BOLD, 9, (0.1, 0.26, 0.53))
        cursor_y -= 12

        for line in section.lines:
            text(x + line.indent, cursor_y, line.text, line.font, line.size, line.color)
            cursor_y -= line.leading

        cursor_y -= 5

    return "\n".join(commands)


def write_pdf(content_stream: str) -> None:
    content_bytes = content_stream.encode("latin-1", errors="replace")

    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Count 1 /Kids [3 0 R] >>",
        (
            f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {PAGE_WIDTH} {PAGE_HEIGHT}] "
            f"/Resources << /Font << /{FONT_REGULAR} 4 0 R /{FONT_BOLD} 5 0 R >> >> "
            f"/Contents 6 0 R >>"
        ).encode("latin-1"),
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
        f"<< /Length {len(content_bytes)} >>\nstream\n".encode("latin-1")
        + content_bytes
        + b"\nendstream",
    ]

    pdf = bytearray(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
    offsets: list[int] = [0]

    for index, obj in enumerate(objects, start=1):
        offsets.append(len(pdf))
        pdf.extend(f"{index} 0 obj\n".encode("latin-1"))
        pdf.extend(obj)
        pdf.extend(b"\nendobj\n")

    xref_offset = len(pdf)
    pdf.extend(f"xref\n0 {len(objects) + 1}\n".encode("latin-1"))
    pdf.extend(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        pdf.extend(f"{offset:010d} 00000 n \n".encode("latin-1"))

    pdf.extend(
        (
            f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref_offset}\n%%EOF"
        ).encode("latin-1")
    )

    OUTPUT.write_bytes(pdf)


def main() -> None:
    title, intro, sections = parse_markdown()
    content = build_content_stream(title, intro, sections)
    write_pdf(content)
    print(f"Generated {OUTPUT}")


if __name__ == "__main__":
    main()
