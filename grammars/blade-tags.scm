; Named view regions, not every HTML element or directive argument.
[(section) (fragment) (stack)] @definition.module

((parameter) @name
  (#is? test.childOfType "section fragment stack")
  (#match? @name "^['\"][^'\"]+['\"]$")
  (#set! symbol.strip "^['\"]|['\"]$"))
