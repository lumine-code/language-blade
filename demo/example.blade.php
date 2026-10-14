<!doctype html>
<html>
  <body>
    {{-- A Blade comment. --}}
    @if (count($items) > 0)
      {{ $user->name }}
      {!! $html !!}
      <x-alert :message="$m" ::raw="{ a: 1 }" />
      <div wire:click="go" x-data="{ n: 1 }">
        <p>Some text.</p>
      </div>
    @else
      <?php echo "none"; ?>
    @endif
    <!-- A plain HTML comment. -->
    @php
      $x = 1;
    @endphp
  </body>
</html>
