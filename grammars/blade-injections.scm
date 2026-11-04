((envoy (text) @injection.content) @injection.owner
  (#set! injection.language "bash")
  (#set! injection.newlines-between)
  (#set! injection.content-edit-policy "content-words"))

((attribute
  (attribute_name) @_name
  (quoted_attribute_value (attribute_value) @injection.content)) @injection.owner
  (#any-of? @_name "wire:model" "wire:click" "wire:stream" "wire:text" "wire:show")
  (#set! injection.language "javascript")
  (#set! injection.content-edit-policy "content-words"))

((attribute
  (attribute_name) @_name
  (quoted_attribute_value (attribute_value) @injection.content)) @injection.owner
  (#match? @_name "^x-[a-z]+")
  (#not-any-of? @_name "x-teleport" "x-ref" "x-transition")
  (#set! injection.language "javascript")
  (#set! injection.content-edit-policy "content-words"))

((comment) @injection.owner @injection.content
  (#set! injection.language "hyperlink")
  (#set! injection.language-scope "none")
  (#set! injection.include-children))

((attribute_value) @injection.owner @injection.content
  (#set! injection.language "hyperlink")
  (#set! injection.language-scope "none"))
((comment) @injection.owner @injection.content
  (#set! injection.language "todo")
  (#set! injection.language-scope "none")
  (#set! injection.include-children))
