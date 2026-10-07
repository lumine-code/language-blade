describe("Blade upstream parser regressions", () => {
  let editor;

  beforeEach(async () => {
    await lumine.packages.activatePackage("language-blade");
    editor = await lumine.workspace.open();
    editor.setGrammar(lumine.grammars.grammarForScopeName("text.html.php.blade"));
  });

  afterEach(() => editor?.destroy());

  it("keeps nested conditional branches with their own directives", async () => {
    editor.setText(
      "@if($visible)\n  @if($nested)\n    <div>Hello</div>\n  @else\n    <span>Other</span>\n  @endif\n@endif\n",
    );
    expect(await editor.whenGrammarSettled()).toBe(true);
    const root = editor.getSyntaxNodeAtBufferPosition([0, 0], (node) => !node.parent);
    expect(root.hasError).toBe(false);
    expect(root.descendantsOfType("conditional").length).toBe(2);
  });
});
