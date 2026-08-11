; `html-folds.scm` loads first and folds every element, comment and
; `<script>`/`<style>` block. Everything here is a Blade block construct — a
; `directive_start` … `directive_end` pair — which none of those patterns reach.

[
  (conditional)
  (loop)
  (switch)
  (section)
  (stack)
  (once)
  (verbatim)
  (fragment)
  (envoy)
  (livewire)
] @fold

; `@php … @endphp`, and multi-line `{{ … }}` / `<?php … ?>`.
(php_statement) @fold
