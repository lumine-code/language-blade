const path = require("path");

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
    lumine.config.set("editor.useTreeSitterParsers", true);
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
});
