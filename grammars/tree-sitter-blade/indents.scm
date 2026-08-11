; `html-indents.scm` loads first and handles `start_tag`/`end_tag`. Blade's
; block directives are indented here.

(directive_start) @indent
(directive_end) @dedent

; `@else`, `@elseif`, `@case` — a branch keyword dedents its own line and
; indents the next, so it appears in both lists. `language-ruby` does the same
; for `elsif`/`rescue`/`when`.
(conditional_keyword
  (directive) @dedent)

(conditional_keyword
  (directive) @indent)
