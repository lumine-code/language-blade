; Blade's own nodes. `html-highlights.scm` loads first and covers everything
; tree-sitter-blade inherits from tree-sitter-html; this file only adds what is
; Blade's.
;
; The shapes come from the grammar itself. Two are worth stating, because the
; rules below only make sense against them:
;
;   * A block directive is `directive_start` … `directive_end` — `@if`/`@endif`,
;     `@section`/`@endsection`. A standalone one (`@include`, `@csrf`, `@else`)
;     is a `directive`. `@elseif` and `@else` sit inside a `conditional_keyword`.
;
;   * `_directive_parameter := "(" parameter* ")"` is hidden, so the parens are
;     anonymous siblings of the `parameter` nodes rather than their children.
;     `parameter` is either a run of paren-free text or a nested `"(" parameter*
;     ")"`. The PHP injection covers the parameters; only the parens are Blade's.


; DIRECTIVES
; ==========

; `@if`, `@foreach`, `@section`, `@php`, `@verbatim` — the opener of a block.
(directive_start) @keyword.control.directive.blade

; `@endif`, `@endforeach`, `@endsection`, `@endphp`…
(directive_end) @keyword.control.directive.blade

; `@include`, `@extends`, `@csrf`, `@class`, `@else`, `@elseif` — standalone,
; and the branch keywords inside a conditional.
(directive) @keyword.control.directive.blade

; The parentheses of a directive's argument list. The argument itself is
; injected PHP, so this is the only part of it Blade scopes.
[
  "("
  ")"
] @punctuation.definition.parameters.bracket.round.blade

; A comma between two arguments belongs to the injected PHP, not to Blade — it
; is deliberately left unscoped here.


; ECHOES AND RAW PHP
; ==================

; `{{ $name }}` — escaped output.
[
  "{{"
  "}}"
] @punctuation.section.embedded.blade

; `{!! $html !!}` — unescaped output.
[
  "{!!"
  "!!}"
] @punctuation.section.embedded.raw.blade

; `<?php` … `?>`.
[
  (php_tag)
  (php_end_tag)
] @punctuation.section.embedded.blade


; COMMENTS
; ========
;
; Blade redefines `comment` to cover `{{-- … --}}`. `html-highlights.scm` scopes
; the `<!-- … -->` spelling and is guarded to that; these are guarded to this
; one, so exactly one of the two fires per node.

((comment) @comment.block.blade
  (#match? @comment.block.blade "^\\{\\{--"))

((comment) @punctuation.definition.comment.begin.blade
  (#match? @punctuation.definition.comment.begin.blade "^\\{\\{--")
  (#set! adjust.startAndEndAroundFirstMatchOf "^\\{\\{--"))

((comment) @punctuation.definition.comment.end.blade
  (#match? @punctuation.definition.comment.end.blade "^\\{\\{--")
  (#set! adjust.startAndEndAroundFirstMatchOf "--\\}\\}$"))


; COMPONENTS
; ==========

; `<x-alert>`, `<x-slot:heading>` — a Blade component rather than an element.
; Additive: the `entity.name.tag.html` fallback in `html-highlights.scm` carries
; no `capture.final`, so a component keeps both scopes.
((tag_name) @entity.name.tag.component.blade
  (#match? @entity.name.tag.component.blade "^x-"))
