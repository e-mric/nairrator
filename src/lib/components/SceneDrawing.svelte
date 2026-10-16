<script lang="ts">
  let { screen = false, scene = 0 }: { screen?: boolean; scene?: number } = $props();
</script>

<!-- Symbolic source illustrations, not screenshots or evidence of runtime behavior. -->
<svg class="scene-drawing" viewBox="0 0 240 140" fill="none" aria-hidden="true">
  <g stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
    {#if screen}
      <path d="M32 19 Q118 15 208 20 L210 116 Q120 120 31 115 Z" />
      <path opacity=".3" d="M29 22 L205 17 L213 113 M34 119 L207 121" />
      <path d="M33 36 L209 35 M42 27 h2 m6 0 h2 m6 0 h2" />
      <path
        d="M46 49 L104 48 L103 99 L46 100 Z M119 51 l66 -1 M119 61 l48 1 M119 73 l61 -1 M119 84 l35 1"
      />
      <path opacity=".45" d="M49 94 l16 -22 l12 12 l12 -25 l12 35 M51 97 l49 -1" />
      <path d="M120 96 Q147 94 175 96 L175 104 L120 105 Z" />
      <path d="M161 109 l-5 -17 l16 10 l-7 1 Z m4 -6 l5 9" />
    {:else if scene % 3 === 1}
      <path d="M35 20 L188 18 L190 109 L34 112 Z M36 35 L187 34" />
      <path opacity=".35" d="M32 23 L31 115 L186 114 M41 27 h2 m7 0 h2" />
      <path d="M52 49 l68 -1 M52 59 l103 1 M52 69 l79 -1 M55 83 Q88 81 120 83 L121 96 L55 97 Z" />
      <path
        d="M145 121 l-15 -18 Q126 96 131 94 Q135 92 143 101 L140 70 Q140 64 145 65 Q149 65 150 71 L154 91 Q172 84 178 94 L188 119 M154 91 l3 14 M165 91 l3 12"
      />
      <path opacity=".45" d="M135 61 l-5 -7 M145 58 l1 -10 M154 62 l7 -7" />
    {:else if scene % 3 === 2}
      <path
        d="M41 43 L153 24 L202 61 L91 84 Z M42 54 L91 94 L202 73 M42 67 L91 106 L202 85 M42 80 L91 119 L202 98"
      />
      <path opacity=".35" d="M45 45 L91 81 L198 62 M46 83 L91 122 L198 101" />
      <path d="M90 48 l-10 10 l12 6 M137 40 l12 7 l-12 10 M119 39 l-9 25" />
    {:else}
      <path d="M66 21 L167 18 L192 43 L195 116 L64 119 Z M168 19 L168 45 L191 43" />
      <path opacity=".3" d="M61 24 L61 121 L191 122 M69 23 L164 21" />
      <path d="M94 54 l-13 12 l13 11 M151 53 l13 12 l-13 12 M130 49 l-10 33" />
      <path d="M82 94 l45 -1 M83 102 l79 -1 M138 93 l24 1" opacity=".6" />
      <path d="M24 70 Q34 61 50 66 m-7 -7 l8 7 l-9 5 M202 81 Q217 83 222 69 m-6 4 l6 -5 l4 9" />
    {/if}
    <path
      opacity=".2"
      d="M26 129 Q120 125 215 128 M41 132 l12 -5 m1 5 l12 -5 m1 5 l12 -5 m98 3 l12 -4"
    />
  </g>
</svg>
