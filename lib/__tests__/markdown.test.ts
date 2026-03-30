import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { renderMarkdown } from "../markdown";

// Feature: international-newspaper-cms, Property 5: Markdown round-trip rendering

describe("renderMarkdown - unit tests", () => {
  it("renders H1 to <h1> tag", async () => {
    const html = await renderMarkdown("# Hello");
    expect(html).toContain("<h1>");
  });

  it("renders H2 to <h2> tag", async () => {
    const html = await renderMarkdown("## Hello");
    expect(html).toContain("<h2>");
  });

  it("renders H3 to <h3> tag", async () => {
    const html = await renderMarkdown("### Hello");
    expect(html).toContain("<h3>");
  });

  it("renders bold **text** to <strong> tag", async () => {
    const html = await renderMarkdown("**bold text**");
    expect(html).toContain("<strong>");
  });

  it("renders italic *text* to <em> tag", async () => {
    const html = await renderMarkdown("*italic text*");
    expect(html).toContain("<em>");
  });

  it("renders blockquote > text to <blockquote> tag", async () => {
    const html = await renderMarkdown("> quoted text");
    expect(html).toContain("<blockquote>");
  });

  it("renders ordered list to <ol> and <li> tags", async () => {
    const html = await renderMarkdown("1. first\n2. second");
    expect(html).toContain("<ol>");
    expect(html).toContain("<li>");
  });

  it("renders unordered list to <ul> and <li> tags", async () => {
    const html = await renderMarkdown("- item one\n- item two");
    expect(html).toContain("<ul>");
    expect(html).toContain("<li>");
  });

  it("renders inline code `code` to <code> tag", async () => {
    const html = await renderMarkdown("use `console.log` here");
    expect(html).toContain("<code>");
  });

  it("renders fenced code block to <pre> and <code> tags", async () => {
    const html = await renderMarkdown("```\nconst x = 1;\n```");
    expect(html).toContain("<pre>");
    expect(html).toContain("<code>");
  });
});

describe("renderMarkdown - Property 5: Markdown round-trip rendering", () => {
  // Arbitraries for each supported block type
  // Words: start and end with alphanumeric, no leading/trailing spaces, no special markdown chars
  const word = fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9]{1,19}$/);

  const h1Arb = word.map((w) => ({ md: `# ${w}`, tag: "<h1>" }));
  const h2Arb = word.map((w) => ({ md: `## ${w}`, tag: "<h2>" }));
  const h3Arb = word.map((w) => ({ md: `### ${w}`, tag: "<h3>" }));
  const boldArb = word.map((w) => ({ md: `**${w}**`, tag: "<strong>" }));
  const italicArb = word.map((w) => ({ md: `*${w}*`, tag: "<em>" }));
  const blockquoteArb = word.map((w) => ({ md: `> ${w}`, tag: "<blockquote>" }));
  const orderedListArb = word.map((w) => ({ md: `1. ${w}`, tag: "<ol>" }));
  const unorderedListArb = word.map((w) => ({ md: `- ${w}`, tag: "<ul>" }));
  const inlineCodeArb = word.map((w) => ({ md: `\`${w}\``, tag: "<code>" }));
  const codeBlockArb = word.map((w) => ({ md: `\`\`\`\n${w}\n\`\`\``, tag: "<pre>" }));

  const blockArb = fc.oneof(
    h1Arb,
    h2Arb,
    h3Arb,
    boldArb,
    italicArb,
    blockquoteArb,
    orderedListArb,
    unorderedListArb,
    inlineCodeArb,
    codeBlockArb
  );

  it("renders each supported block type to its expected HTML element (Property 5)", async () => {
    // Feature: international-newspaper-cms, Property 5: Markdown round-trip rendering
    await fc.assert(
      fc.asyncProperty(blockArb, async ({ md, tag }) => {
        const html = await renderMarkdown(md);
        expect(html).toContain(tag);
      }),
      { numRuns: 100 }
    );
  });
});
