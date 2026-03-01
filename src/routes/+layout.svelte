<script lang="ts">
  import '../app.css'
  import logoSvg from '$lib/assets/logo.svg'
  import logoPng from '$lib/assets/logo.png'
  let { children } = $props()
  const title = 'hkcrush'
  const description =
    "hash your crush's slack ID, share the link, they can enter their ID and see if it matches"
  const theme = '#2563EB'
  const ogImage = logoPng
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="theme-color" content={theme} />
  <link rel="icon" type="image/svg+xml" href={logoSvg} />
  <link rel="icon" type="image/png" href={logoPng} sizes="64x64" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:image" content={ogImage} />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content={title} />
  <meta name="twitter:description" content={description} />
  <meta name="twitter:image" content={ogImage} />
</svelte:head>

<div
  class="flex min-h-screen flex-col bg-white text-[17px] leading-relaxed text-slate-800 dark:bg-slate-900 dark:text-slate-100"
>
  <header class="flex items-center justify-between p-6">
    <h1 class="text-4xl font-black tracking-tight lowercase select-none">
      <span class="text-blue-600">
        hkcrush
      </span>
    </h1>
    <nav aria-label="primary" class="text-base">
      <a
        href="https://github.com/jeremy46231/hkcrush"
        target="_blank"
        rel="noopener noreferrer"
        class="opacity-70 transition hover:opacity-100"
      >
        github
      </a>
    </nav>
  </header>
  <main class="flex flex-1 flex-col items-center px-5 pb-28">
    {@render children?.()}
  </main>
  <footer class="py-8 text-center text-sm opacity-70">
    made by <a
      href="https://jeremywoolley.com"
      class="underline decoration-dotted hover:decoration-solid"
      target="_blank"
    >
      jeremy
    </a>
  </footer>
</div>

<style>
  :global(html) {
    color-scheme: light dark;
  }
</style>
