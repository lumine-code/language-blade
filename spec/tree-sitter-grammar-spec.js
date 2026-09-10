const fs = require("fs");
const path = require("path");
const { Point } = require("lumine");

const HTML_HIGHLIGHTS_PATH = path.join(__dirname, "..", "grammars", "blade-html-highlights.scm");

// Asserts the scopes the grammar actually produces, using the fixture beside
// this file. `runGrammarTests` reads `<- scope` and `^ scope` assertions out of
// the fixture's own comments, so the fixture is the readable spec.
//
// A fixture whose assertions never run still reports green, so break one
// expected scope and confirm this fails before trusting it.
//
// The assertions are written in `<!-- -->` rather than Blade's own `{{-- --}}`
// on purpose. Both parse to a `comment` node, and the two are told apart by a
// `#match?` guard in the highlights queries — so writing the assertions in the
// Blade spelling would make the fixture's ability to run at all depend on the
// very rule under test.

describe("Blade Tree-sitter grammar", () => {
  beforeEach(async () => {
    await lumine.packages.activatePackage("language-blade");
    // The fixture asserts PHP scopes inside directives and echoes, and
    // JavaScript inside Livewire and Alpine attributes. Without these the
    // injections resolve to nothing and the failure does not say why.
    await lumine.packages.activatePackage("language-php");
    await lumine.packages.activatePackage("language-javascript");
  });

  it("tokenizes the fixture", async () => {
    await runGrammarTests(path.join(__dirname, "fixtures", "sample.blade.php"), /<!--/, /-->/);
  });

  it("preserves HTML tag classes and empty attribute delimiters", async () => {
    const editor = await lumine.workspace.open("tag-scopes.blade.php");
    const text = "<html><div><span><custom first=\"\" second='' /></span></div></html>";
    editor.setText(text);
    await editor.languageMode.ready;

    const scopesAt = (needle, offset = 0, occurrence = 0) => {
      let index = -1;
      for (let count = 0; count <= occurrence; count++) index = text.indexOf(needle, index + 1);
      return editor
        .scopeDescriptorForBufferPosition(
          editor.getBuffer().positionForCharacterIndex(index + offset),
        )
        .getScopesArray();
    };

    for (const occurrence of [0, 1]) {
      expect(scopesAt("html", 0, occurrence)).toContain("entity.name.tag.structure.html.html");
      expect(scopesAt("div", 0, occurrence)).toContain("entity.name.tag.block.div.html");
      expect(scopesAt("span", 0, occurrence)).toContain("entity.name.tag.inline.span.html");
    }
    expect(scopesAt("custom")).toContain("entity.name.tag.html");
    expect(scopesAt("<custom")).toContain("punctuation.definition.tag.begin.html");
    expect(scopesAt("/>", 1)).toContain("punctuation.definition.tag.end.html");

    for (const [quote, opening, closing] of [
      ['"', 0, 1],
      ["'", 0, 1],
    ]) {
      expect(scopesAt(quote, 0, opening)).toContain("punctuation.definition.string.begin.html");
      expect(scopesAt(quote, 0, opening)).not.toContain("punctuation.definition.string.end.html");
      expect(scopesAt(quote, 0, closing)).toContain("punctuation.definition.string.end.html");
      expect(scopesAt(quote, 0, closing)).not.toContain("punctuation.definition.string.begin.html");
    }
  });

  it("keeps a six-row tile local inside a 6000-attribute HTML tag", async () => {
    const editor = await lumine.workspace.open("large-start-tag.blade.php");
    const lines = [
      "<root",
      ...Array.from({ length: 6000 }, (_, index) => `  key_${index}="value_${index}"`),
      ">body</root>",
    ];
    editor.setText(lines.join("\r\n"));
    const languageMode = editor.getBuffer().languageMode;
    await languageMode.ready;
    expect(languageMode.tree.rootNode.hasError).toBe(false);

    const startRow = 2998;
    const endRow = startRow + 6;
    const layer = languageMode.rootLanguageLayer;
    const captures = layer.queries.highlightsQuery.captures(layer.tree.rootNode, {
      startPosition: new Point(startRow, 0),
      endPosition: new Point(endRow, 0),
    });

    expect(captures.length).toBeLessThanOrEqual(60);
    expect(
      captures.every(
        ({ node }) => node.startPosition.row >= startRow && node.startPosition.row < endRow,
      ),
    ).toBe(true);
  });

  it("keeps unbounded HTML tag contexts leaf-rooted", () => {
    const query = fs.readFileSync(HTML_HIGHLIGHTS_PATH, "utf8");
    expect(query).not.toMatch(/^\((?:start_tag|end_tag|self_closing_tag)\b/m);
    expect(query).toContain('(#is? test.childOfType "start_tag end_tag")');
    expect(query).toContain('(#is? test.childOfType "start_tag end_tag self_closing_tag")');
  });
});
