<!doctype html>
<!-- <- meta.tag.doctype -->
<html>
  <body>
    {{-- A Blade comment. --}}
<!--        ^ comment.block.blade -->
    @if (count($items) > 0)
<!-- ^ keyword.control.directive -->
<!--    ^ punctuation.definition.parameters -->
<!--      ^ source.php -->
<!--            ^ variable.other -->
      {{ $user->name }}
<!--  ^ punctuation.section.embedded -->
<!--       ^ variable.other -->
<!--              ^ support.other.property -->
      {!! $html !!}
<!--    ^ punctuation.section.embedded.raw -->
      <x-alert :message="$m" ::raw="{ a: 1 }" />
<!--     ^ entity.name.tag.component -->
<!--              ^ entity.other.attribute-name.html -->
<!--                      ^ source.php -->
<!--                                  ^ source.js -->
      <div wire:click="go" x-data="{ n: 1 }">
<!--       ^ entity.other.attribute-name.html -->
<!--                   ^ source.js -->
<!--                                 ^ source.js -->
        <p>Some text.</p>
<!--     ^ entity.name.tag.block -->
      </div>
    @else
<!-- ^ keyword.control.directive -->
      <?php echo "none"; ?>
<!--    ^ punctuation.section.embedded -->
<!--          ^ keyword -->
    @endif
<!-- ^ keyword.control.directive -->
    <!-- A plain HTML comment. -->
    @php
      $x = 1;
    @endphp
  </body>
</html>
