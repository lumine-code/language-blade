; PORTED FROM language-html
; =========================
;
; tree-sitter-blade inlines tree-sitter-html's grammar and takes over its tree,
; so every node and token below carries the same name it does there and this
; file is a port of `language-html/grammars/html-highlights.scm`.
; Keep it diffable against that origin: Blade's own rules live in
; `highlights.scm`, which loads after this file.
;
; The captures keep their `.html` segment on purpose. A `<div>` in a Blade view
; *is* HTML, and the segment names which language owns the token, not which file
; it was typed in.
;
; ONE deliberate delta from the origin, marked below: the `(comment)` rules.

(doctype) @meta.tag.doctype.html

(doctype
  "<!" @punctuation.definition.tag.begin.html
  "doctype" @entity.name.tag.doctype.html
  ">" @punctuation.definition.tag.end.html) @meta.tag.doctype.html

(style_element
  (raw_text) @meta.embedded.block.css.html)

(script_element
  (raw_text) @meta.embedded.block.js.html)

; COMMENTS
; ========
;
; DELTA: Blade redefines `comment` to cover `{{-- … --}}` as well, so each rule
; here is narrowed to the HTML spelling. The Blade spelling is scoped by the
; matching rules in `highlights.scm`; without the guard both would fire on the
; same node and a Blade comment would come out scoped `.html`.

((comment) @comment.block.html
  (#match? @comment.block.html "^<!--"))

((comment) @punctuation.definition.comment.begin.html
  (#match? @punctuation.definition.comment.begin.html "^<!--")
  (#set! adjust.startAndEndAroundFirstMatchOf "^<!--"))

((comment) @punctuation.definition.comment.end.html
  (#match? @punctuation.definition.comment.end.html "^<!--")
  (#set! adjust.startAndEndAroundFirstMatchOf "-->$"))


; SUPPORT
; =======

(start_tag
  (tag_name) @entity.name.tag.structure._TEXT_.html
  (#match? @entity.name.tag.structure._TEXT_.html "^(body|head|html|BODY|HEAD|HTML)$")
  (#set! capture.final true))

(end_tag
  (tag_name) @entity.name.tag.structure._TEXT_.html
  (#match? @entity.name.tag.structure._TEXT_.html "^(body|head|html|BODY|HEAD|HTML)$")
  (#set! capture.final true))

(start_tag
  (tag_name) @entity.name.tag.block._TEXT_.html
  (#match? @entity.name.tag.block._TEXT_.html "^(address|blockquote|dd|div|section|article|aside|header|footer|nav|menu|dl|dt|fieldset|form|frame|frameset|h1|h2|h3|h4|h5|h6|iframe|noframes|object|ol|p|ul|applet|center|dir|hr|pre|ADDRESS|BLOCKQUOTE|DD|DIV|SECTION|ARTICLE|ASIDE|HEADER|FOOTER|NAV|MENU|DL|DT|FIELDSET|FORM|FRAME|FRAMESET|H1|H2|H3|H4|H5|H6|IFRAME|NOFRAMES|OBJECT|OL|P|UL|APPLET|CENTER|DIR|HR|PRE)$")
  (#set! capture.final true))

(end_tag
  (tag_name) @entity.name.tag.block._TEXT_.html
  (#match? @entity.name.tag.block._TEXT_.html "^(address|blockquote|dd|div|section|article|aside|header|footer|nav|menu|dl|dt|fieldset|form|frame|frameset|h1|h2|h3|h4|h5|h6|iframe|noframes|object|ol|p|ul|applet|center|dir|hr|pre|ADDRESS|BLOCKQUOTE|DD|DIV|SECTION|ARTICLE|ASIDE|HEADER|FOOTER|NAV|MENU|DL|DT|FIELDSET|FORM|FRAME|FRAMESET|H1|H2|H3|H4|H5|H6|IFRAME|NOFRAMES|OBJECT|OL|P|UL|APPLET|CENTER|DIR|HR|PRE)$")
  (#set! capture.final true))

(start_tag
  (tag_name) @entity.name.tag.inline._TEXT_.html
  (#match? @entity.name.tag.inline._TEXT_.html "^(a|abbr|acronym|area|b|base|basefont|bdo|big|br|button|caption|cite|code|col|colgroup|del|dfn|em|font|head|html|i|img|input|ins|isindex|kbd|label|legend|li|link|map|meta|noscript|optgroup|option|param|q|s|samp|script|select|small|span|strike|strong|style|sub|sup|table|tbody|td|textarea|tfoot|th|thead|title|tr|tt|u|var|A|ABBR|ACRONYM|AREA|B|BASE|BASEFONT|BDO|BIG|BR|BUTTON|CAPTION|CITE|CODE|COL|COLGROUP|DEL|DFN|EM|FONT|HEAD|HTML|I|IMG|INPUT|INS|ISINDEX|KBD|LABEL|LEGEND|LI|LINK|MAP|META|NOSCRIPT|OPTGROUP|OPTION|PARAM|Q|S|SAMP|SCRIPT|SELECT|SMALL|SPAN|STRIKE|STRONG|STYLE|SUB|SUP|TABLE|TBODY|TD|TEXTAREA|TFOOT|TH|THEAD|TITLE|TR|TT|U|VAR)$")
  (#set! capture.final true))

(end_tag
  (tag_name) @entity.name.tag.inline._TEXT_.html
  (#match? @entity.name.tag.inline._TEXT_.html "^(a|abbr|acronym|area|b|base|basefont|bdo|big|br|button|caption|cite|code|col|colgroup|del|dfn|em|font|head|html|i|img|input|ins|isindex|kbd|label|legend|li|link|map|meta|noscript|optgroup|option|param|q|s|samp|script|select|small|span|strike|strong|style|sub|sup|table|tbody|td|textarea|tfoot|th|thead|title|tr|tt|u|var|A|ABBR|ACRONYM|AREA|B|BASE|BASEFONT|BDO|BIG|BR|BUTTON|CAPTION|CITE|CODE|COL|COLGROUP|DEL|DFN|EM|FONT|HEAD|HTML|I|IMG|INPUT|INS|ISINDEX|KBD|LABEL|LEGEND|LI|LINK|MAP|META|NOSCRIPT|OPTGROUP|OPTION|PARAM|Q|S|SAMP|SCRIPT|SELECT|SMALL|SPAN|STRIKE|STRONG|STYLE|SUB|SUP|TABLE|TBODY|TD|TEXTAREA|TFOOT|TH|THEAD|TITLE|TR|TT|U|VAR)$")
  (#set! capture.final true))


; ELEMENTS
; ========

; Tag names
; ---------

(start_tag
  "<" @punctuation.definition.tag.begin.html
  ">" @punctuation.definition.tag.end.html)

; Fallback for any tag that didn't get scoped in the Support section above.
(start_tag
  (tag_name) @entity.name.tag.html)

(end_tag
  "</" @punctuation.definition.tag.begin.html
  ">" @punctuation.definition.tag.end.html)

(end_tag
  (tag_name) @entity.name.tag.html)

(self_closing_tag
  "<" @punctuation.definition.tag.begin.html
  (tag_name) @entity.name.tag.html
  "/>" @punctuation.definition.tag.end.html)


; Invalid tag names
; -----------------

(erroneous_end_tag) @entity.name.tag.html
(erroneous_end_tag_name) @invalid.illegal.erroneous-end-tag-name.html


; Attributes
; ----------

(attribute "=" @punctuation.separator.key-value.html)
(attribute_name) @entity.other.attribute-name.html

; If this matches, the value is double-quoted.
(quoted_attribute_value "\"") @string.quoted.double.html

; If this matches, the value is single-quoted.
(quoted_attribute_value "'") @string.quoted.single.html


; Single- and double-quotes around attribute values.
((quoted_attribute_value ["\"" "'"] @punctuation.definition.string.begin.html)
  (#is? test.first true))

((quoted_attribute_value ["\"" "'"] @punctuation.definition.string.end.html)
  (#is? test.last true))


; Prevent quoted attribute values from having `string.unquoted` applied.
(quoted_attribute_value
  (attribute_value) @_IGNORE_
  (#set! capture.final true))

; The "foo" in `<div class=foo>`.
; Because of the preceding rule, if this matches and passes all tests, the
; value must be unquoted.
(attribute_value) @string.unquoted.html


; MISC
; ====

(entity) @constant.character.entity.html

; Helpers for autocomplete-html

((element) @meta.tag.incomplete.html
  (#not-match? @meta.tag.incomplete.html ">$"))
