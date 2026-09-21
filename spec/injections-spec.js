const path = require("path");

// The parts of the grammar `tree-sitter-grammar-spec.js` cannot reach, and the
// facts its caret assertions would not explain if they broke.
//
// The whole point of a Blade view is that its directives and echoes hold bare
// PHP — no `<?php` to enter PHP mode — so the interesting assertions are about
// which grammar an injection resolved to and over exactly which range.

const FIXTURE = path.join(__dirname, "fixtures", "sample.blade.php");
const packagePath = (name) => path.resolve(__dirname, "..", "..", name);

// The first line whose text contains `needle`, offset columns in from there.
function positionOf(editor, needle, offset = 0) {
  const lines = editor.getBuffer().getLines();
  for (let row = 0; row < lines.length; row++) {
    const column = lines[row].indexOf(needle);
    if (column !== -1) return { row, column: column + offset };
  }
  throw new Error(`Fixture has no line containing ${JSON.stringify(needle)}`);
}

function scopesAt(editor, position) {
  return editor.scopeDescriptorForBufferPosition(position).getScopesArray();
}

describe("Blade injections", () => {
  let editor;

  beforeEach(async () => {
    await lumine.packages.activatePackage("language-blade");
    await lumine.packages.activatePackage(packagePath("language-php"));
    await lumine.packages.activatePackage(packagePath("language-javascript"));
    await lumine.packages.activatePackage(packagePath("language-shellscript"));

    editor = await lumine.workspace.open(FIXTURE);
    await editor.languageMode.ready;
  });

  it("parses the fixture without error", () => {
    expect(editor.getBuffer().getLanguageMode().tree.rootNode.hasError).toBe(false);
  });

  it("reaches the bare-PHP dialect, not the HTML-wrapping one", () => {
    // `source.php.only` is what makes `{{ $x }}` parse at all: `source.php`
    // starts in text mode and needs a literal `<?php` inside the range.
    const grammar = lumine.grammars.treeSitterGrammarForLanguageString("php_only");
    expect(grammar?.scopeName).toBe("source.php.only");
  });

  it("injects PHP into an echo", () => {
    const position = positionOf(editor, "{{ $user->name }}", 4);
    const scopes = scopesAt(editor, position);
    expect(scopes).toContain("source.php.only");
    expect(scopes).toContain("meta.embedded.line.php");
  });

  it("injects PHP into a directive's whole argument list", () => {
    // `@if (count($items) > 0)` is three sibling `parameter` nodes, not one:
    // `count`, a nested-paren `($items)`, and ` > 0`. The injection has to span
    // the run, or the PHP parser gets three fragments and none of them is an
    // expression. Assert both ends of it.
    const line = positionOf(editor, "@if (count($items) > 0)").row;
    const open = editor.getBuffer().getLines()[line].indexOf("(");
    expect(scopesAt(editor, { row: line, column: open + 1 })).toContain("source.php.only");
    const close = editor.getBuffer().getLines()[line].lastIndexOf(")");
    expect(scopesAt(editor, { row: line, column: close - 1 })).toContain("source.php.only");
  });

  it("keeps the directive's own parentheses out of the injection", () => {
    const line = positionOf(editor, "@if (count($items) > 0)").row;
    const open = editor.getBuffer().getLines()[line].indexOf("(");
    const scopes = scopesAt(editor, { row: line, column: open });
    expect(scopes).not.toContain("source.php.only");
    expect(scopes).toContain("punctuation.definition.parameters.bracket.round.blade");
  });

  it("injects PHP into a raw `<?php … ?>` block", () => {
    const position = positionOf(editor, '<?php echo "none"; ?>', 7);
    expect(scopesAt(editor, position)).toContain("source.php.only");
  });

  it("injects JavaScript into a Livewire attribute", () => {
    const position = positionOf(editor, 'wire:click="go"', 12);
    expect(scopesAt(editor, position)).toContain("source.js");
  });

  it("injects JavaScript into an Alpine attribute", () => {
    const position = positionOf(editor, 'x-data="{ n: 1 }"', 10);
    expect(scopesAt(editor, position)).toContain("source.js");
  });

  it("injects PHP into a bound component prop and JavaScript into an escaped one", () => {
    const row = positionOf(editor, "<x-alert").row;
    const line = editor.getBuffer().getLines()[row];
    // `:message="$m"` binds PHP.
    expect(scopesAt(editor, { row, column: line.indexOf('"$m"') + 1 })).toContain(
      "source.php.only",
    );
    // `::raw="…"` escapes the binding, so the value stays JavaScript.
    expect(scopesAt(editor, { row, column: line.indexOf("{ a: 1 }") + 2 })).toContain("source.js");
  });

  it("leaves a plain attribute value alone", () => {
    // The counterpart to the rules above: `class="a"` is a literal, and must
    // pick up neither injected language.
    const position = positionOf(editor, "<html>");
    const scopes = scopesAt(editor, position);
    expect(scopes).not.toContain("source.js");
    expect(scopes).not.toContain("source.php.only");
  });
});
