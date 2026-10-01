((envoy (text) @injection.content) @injection.owner
  (#set! injection.language "bash")
  (#set! injection.newlines-between))

((attribute
  (attribute_name) @_name
  (quoted_attribute_value (attribute_value) @injection.content)) @injection.owner
  (#any-of? @_name "wire:model" "wire:click" "wire:stream" "wire:text" "wire:show")
  (#set! injection.language "javascript"))

((attribute
  (attribute_name) @_name
  (quoted_attribute_value (attribute_value) @injection.content)) @injection.owner
  (#match? @_name "^x-[a-z]+")
  (#not-any-of? @_name "x-teleport" "x-ref" "x-transition")
  (#set! injection.language "javascript"))
