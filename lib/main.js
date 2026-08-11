const SCOPE = "text.html.php.blade";

// Bare PHP — no `<?php` to enter PHP mode. `source.php` cannot parse a Blade
// expression: its parser starts in text mode, which is why language-php's own
// injection extends every range to include the delimiters. `source.php.only` is
// the dialect for exactly this, and this is the string that reaches it.
const PHP = "php_only";

// nvim-treesitter's Livewire list. Everything outside it (`wire:key`,
// `wire:navigate`, `wire:ignore`, `wire:target`) takes a literal rather than an
// expression, and injecting there would highlight a slug as an identifier.
const LIVEWIRE_ATTRIBUTES = new Set([
  "wire:model",
  "wire:click",
  "wire:stream",
  "wire:text",
  "wire:show",
]);

// Alpine. The three exclusions take a selector or a class list, not an
// expression; `x-transition:enter` is still an expression, so the match is
// exact rather than a prefix.
const ALPINE_ATTRIBUTE = /^x-[a-z]+/;
const ALPINE_EXCLUDED = new Set(["x-teleport", "x-ref", "x-transition"]);
// `:class="…"` and `@click="…"` — Alpine's shorthands on an ordinary element.
const ALPINE_SHORTHAND = /^[:@][a-z]+/;

// `<x-alert :message="$m" ::raw="{ a: 1 }" />` — a Blade component, where a
// single colon binds PHP and a doubled one escapes it back to JavaScript.
const COMPONENT_TAG = /^x-[a-z]/;
const COMPONENT_PHP_PROP = /^:[a-z]+/;
const COMPONENT_JS_PROP = /^::[a-z]+/;

function attributeName(node) {
  return node.children.find((child) => child.type === "attribute_name")?.text ?? null;
}

function attributeValue(node) {
  const quoted = node.children.find((child) => child.type === "quoted_attribute_value");
  return quoted?.children.find((child) => child.type === "attribute_value") ?? null;
}

// An `attribute`'s parent is the `start_tag` or `self_closing_tag` that holds
// the `tag_name`.
function tagNameFor(node) {
  return node.parent?.children.find((child) => child.type === "tag_name")?.text ?? null;
}

function isComponentAttribute(node) {
  return COMPONENT_TAG.test(tagNameFor(node) ?? "");
}

// A directive's argument list is `"(" parameter* ")"`, and the rule that spells
// it is hidden — so the parens are anonymous *siblings* of the `parameter`
// nodes, not their children, and one argument list is a contiguous run of
// sibling `parameter`s rather than a single node.
//
// `@if (count($items) > 0)` is three of them: `count`, then a nested-paren
// `($items)`, then ` > 0`. Injected one at a time the PHP parser gets three
// fragments and none of them is an expression, so the run has to go in as one
// range.
//
// That rules out keying the injection on `parameter` itself. An injection's
// marker is created from the *base node's* range — `const injectionRange =
// node.range` — so a layer keyed on the first `parameter` is bounded by that
// first `parameter` no matter how far its content reaches, and everything past
// `count` comes out unscoped. The base node has to be the one the argument list
// hangs off, which is why this registers against the owners below rather than
// against `parameter`.
//
// The list is every named node type whose `children` include `parameter`, taken
// from the grammar's own `src/node-types.json` — not a guess, and re-derivable
// with one query when the parser is bumped. `parameter` is excluded: a nested
// `parameter` is already inside its ancestor's run.
const PARAMETER_OWNERS = [
  "attribute",
  "conditional",
  "conditional_keyword",
  "document",
  "element",
  "envoy",
  "fragment",
  "livewire",
  "loop",
  "once",
  "php_statement",
  "quoted_attribute_value",
  "section",
  "stack",
  "switch",
  "verbatim",
];

function hasParameterChild(node) {
  return node.children.some((child) => child.type === "parameter");
}

// One synthetic range per contiguous run of direct `parameter` children. A node
// can hold more than one run — a `document` holds the argument list of every
// inline directive in the file — and the gap between two runs is where the `)`
// and the next `(` sit, which is exactly what has to stay out.
//
// `NodeRangeSet#getNodeSpec` reads only `startIndex`, `endIndex`,
// `startPosition` and `endPosition`, so an object carrying those four is
// indistinguishable from a real node. This is the technique language-php uses to
// pair `<?php` with `?>`.
function parameterRuns(node) {
  const runs = [];
  let current = null;
  for (const child of node.children) {
    if (child.type === "parameter") {
      if (current) current.last = child;
      else current = { first: child, last: child };
    } else if (current) {
      runs.push(current);
      current = null;
    }
  }
  if (current) runs.push(current);

  return runs.map(({ first, last }) => ({
    startIndex: first.startIndex,
    endIndex: last.endIndex,
    startPosition: first.startPosition,
    endPosition: last.endPosition,
  }));
}

// For parity with the TextMate Blade grammars, an embedded PHP range carries
// `meta.embedded.line.php` or `.block.php` alongside its base scope, exactly as
// language-php does for `text.html.php`. `grammar.scopeName` is
// `source.php.only`, and a scope is matched segment by segment, so every
// `.source.php` selector — language-php's snippets, comment delimiters and
// settings — still applies inside a Blade file.
function embeddedPhpScope(grammar, _buffer, range) {
  const extra =
    range.start.row !== range.end.row ? "meta.embedded.block.php" : "meta.embedded.line.php";
  return [grammar.scopeName, extra];
}

exports.activate = function () {
  // PHP
  // ===

  // `{{ $name }}`, `{!! $html !!}`, `<?php … ?>` and `@php … @endphp` all park
  // their code in a `php_only` node.
  lumine.grammars.addInjectionPoint(SCOPE, {
    type: "php_only",
    language: () => PHP,
    content: (node) => node,
    languageScope: embeddedPhpScope,
  });

  // `@if(…)`, `@foreach(…)`, `@include(…)`, `@class(…)`. One injection point
  // per node type that can own an argument list; `content` returns nothing for
  // an instance that holds none, and the call site skips an empty result.
  for (const type of PARAMETER_OWNERS) {
    lumine.grammars.addInjectionPoint(SCOPE, {
      type,
      language: (node) => (hasParameterChild(node) ? PHP : null),
      content: parameterRuns,
      languageScope: embeddedPhpScope,
    });
  }

  // ENVOY
  // =====

  // `@task('deploy') … @endtask` bodies are shell scripts. `newlinesBetween`
  // keeps two commands on two lines from being parsed as one, which is what the
  // ERB and EJS injections in language-html need it for too.
  lumine.grammars.addInjectionPoint(SCOPE, {
    type: "envoy",
    language: () => "bash",
    content: (node) => node.descendantsOfType("text"),
    newlinesBetween: true,
  });

  // ATTRIBUTES
  // ==========

  // Livewire: `<button wire:click="increment">`.
  lumine.grammars.addInjectionPoint(SCOPE, {
    type: "attribute",
    language(node) {
      const name = attributeName(node);
      return name && LIVEWIRE_ATTRIBUTES.has(name) ? "javascript" : null;
    },
    content: attributeValue,
  });

  // Alpine: `<div x-data="{ open: false }" @click="open = !open" :class="cls">`.
  //
  // The component guard on the shorthand branch is a deliberate departure from
  // nvim-treesitter, whose Alpine and Blade-component patterns both match
  // `:prop` on an `<x-foo>` and produce two overlapping injections of two
  // different languages over the same range.
  lumine.grammars.addInjectionPoint(SCOPE, {
    type: "attribute",
    language(node) {
      const name = attributeName(node);
      if (!name) return null;
      if (ALPINE_ATTRIBUTE.test(name)) {
        return ALPINE_EXCLUDED.has(name) ? null : "javascript";
      }
      if (!ALPINE_SHORTHAND.test(name)) return null;
      return isComponentAttribute(node) ? null : "javascript";
    },
    content: attributeValue,
  });

  // `<x-foo ::bar="{ a: 1 }" />` — escaped, so the value stays JavaScript.
  lumine.grammars.addInjectionPoint(SCOPE, {
    type: "attribute",
    language(node) {
      const name = attributeName(node);
      if (!name || !COMPONENT_JS_PROP.test(name)) return null;
      return isComponentAttribute(node) ? "javascript" : null;
    },
    content: attributeValue,
  });

  // `<x-foo :bar="$baz" />` — a bound component prop is PHP. `::` is tested
  // first, since it also satisfies the single-colon pattern.
  lumine.grammars.addInjectionPoint(SCOPE, {
    type: "attribute",
    language(node) {
      const name = attributeName(node);
      if (!name || COMPONENT_JS_PROP.test(name) || !COMPONENT_PHP_PROP.test(name)) return null;
      return isComponentAttribute(node) ? PHP : null;
    },
    content: attributeValue,
    languageScope: embeddedPhpScope,
  });
};

exports.consumeHyperlinkInjection = (hyperlink) => {
  hyperlink.addInjectionPoint(SCOPE, {
    types: ["comment", "attribute_value"],
  });
};

exports.consumeTodoInjection = (todo) => {
  todo.addInjectionPoint(SCOPE, { types: ["comment"] });
};
