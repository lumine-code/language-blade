# language-blade

Blade language support.

## Features

- **Grammars**: provides Tree-sitter grammars, built from [tree-sitter-blade](https://github.com/EmranMR/tree-sitter-blade).
- **Syntax highlighting**: full tree-sitter grammar coverage for Laravel views, HTML included.
- **Directives**: scopes block directives, their `@end…` partners, branch keywords and standalone directives.
- **Embedded PHP**: highlights `{{ }}`, `{!! !!}`, `@php` blocks and every directive argument as PHP.
- **Livewire and Alpine**: highlights `wire:`, `x-` and `:`/`@` attribute values as JavaScript, and bound component props as PHP.
- **Folding**: folds directive blocks and elements from the parse tree rather than by indentation.

## Installation

To install `language-blade` search for it in the Install pane of the Lumine settings, or run the command `lumine --install lumine-code/language-blade`.

## Usage

A `.blade.php` file is claimed by this grammar rather than by `language-php`: grammar selection scores a file-type suffix by its length, so `blade.php` outscores `php`.

Directive arguments and echoes hold bare PHP with no `<?php` to enter PHP mode, so they are highlighted with the `source.php.only` grammar that `language-php` provides for exactly this purpose. Install `language-php` to get PHP highlighting inside a view; without it the surrounding markup still highlights.

`@task` bodies inside `@servers`/`@story` blocks are highlighted as shell script, and `<script>` and `<style>` elements as JavaScript and CSS.

## Services

- `hyperlink.injection`: consumed to highlight URLs inside comments and attribute values as clickable links.
- `todo.injection`: consumed to highlight `TODO`-style markers inside comments.

## Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub. Any feedback is welcome!
