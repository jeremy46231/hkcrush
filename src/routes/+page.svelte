<script lang="ts">
  import { pbkdf2Hash } from '$lib/hash'

  // svelte 5 runes for state
  let slackId = $state('')
  let iterations = $state(3_000_000)
  let hashing = $state(false)
  let error = $state<string | null>(null)
  let resultHash = $state<string | null>(null)
  let copied = $state(false)

  const MIN_ITER = 100_000
  const MAX_ITER = 10_000_000

  async function generate() {
    error = null
    copied = false
    resultHash = null
    if (!slackId.trim()) {
      error = 'Please enter a Slack user ID'
      return
    }
    if (iterations < MIN_ITER || iterations > MAX_ITER) {
      error = `Iterations must be between ${MIN_ITER.toLocaleString()} and ${MAX_ITER.toLocaleString()}`
      return
    }
    try {
      hashing = true
      // Use the slackId as the password input directly
      resultHash = await pbkdf2Hash(slackId.trim(), iterations)
    } catch (e) {
      error = 'Failed to hash (browser crypto unsupported?)'
      console.error(e)
    } finally {
      hashing = false
    }
  }

  function urlForCrush() {
    if (!resultHash) return ''
    try {
      const url = new URL('crush', location.href)
      url.hash = resultHash
      return url.toString()
    } catch {
      return `https://hkcrush.jer.app/crush#${encodeURIComponent(resultHash)}`
    }
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      copied = true
      setTimeout(() => (copied = false), 2000)
    } catch (e) {
      console.warn('Clipboard failed', e)
    }
  }
</script>

<div class="w-full max-w-xl space-y-8">
  <section
    class="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
  >
    <h2 class="mb-6 text-2xl font-bold">create your hkcrush link</h2>
    <form
      class="space-y-8"
      onsubmit={(e) => {
        e.preventDefault()
        generate()
      }}
      aria-describedby={error ? 'error-msg' : undefined}
    >
      <div class="space-y-4">
        <label class="block text-lg leading-tight font-medium">
          <span
            class="mb-2 block text-sm font-semibold text-slate-600 dark:text-slate-400"
          >
            their slack id
          </span>
          <input
            placeholder="USLACKBOT"
            autocomplete="off"
            class="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 font-mono text-lg tracking-wide focus:border-blue-500 focus:ring-2 focus:ring-blue-500/60 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
            bind:value={slackId}
            maxlength={64}
          />
          <span class="mt-2 block text-sm text-slate-600 dark:text-slate-400">
            Desktop: open their profile → 3 dots → Copy member ID
          </span>
        </label>
      </div>
      <details
        class="mt-2 rounded-lg border border-slate-300/60 px-4 py-3 text-base open:pb-4 dark:border-slate-700/60"
      >
        <summary class="cursor-pointer text-lg font-semibold select-none">
          Advanced
        </summary>
        <div class="mt-4 space-y-4">
          <label class="block text-base font-medium">
            <span
              class="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400"
            >
              iterations
              <span
                class="rounded bg-slate-200 px-2 py-0.5 text-[11px] font-semibold dark:bg-slate-800"
              >
                PBKDF2-SHA256
              </span>
            </span>
            <div class="flex items-center gap-4">
              <input
                type="number"
                class="w-48 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-lg focus:ring-2 focus:ring-blue-500/60 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                min={MIN_ITER}
                max={MAX_ITER}
                step={100_000}
                bind:value={iterations}
              />
              <input
                type="range"
                min={MIN_ITER}
                max={MAX_ITER}
                step={100_000}
                bind:value={iterations}
                class="flex-1 accent-blue-500"
              />
            </div>
            <span class="mt-2 block text-sm text-slate-600 dark:text-slate-400">
              Increase iterations to slow brute force; lower if hashing feels
              slow.
            </span>
          </label>
        </div>
      </details>
      {#if error}
        <div
          id="error-msg"
          class="text-base font-semibold text-red-600 dark:text-red-400"
          role="alert"
          aria-live="polite"
        >
          {error}
        </div>
      {/if}
      <div class="flex gap-4">
        <button
          type="submit"
          class="relative inline-flex items-center justify-center rounded-xl bg-blue-600 px-8 py-4 text-lg font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={hashing}
        >
          {#if hashing}
            <span class="flex items-center gap-2">
              <span
                class="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
              >
              </span> hashing…
            </span>
          {:else}
            generate link
          {/if}
        </button>
        {#if resultHash}
          <button
            type="button"
            class="rounded-xl border border-slate-300 px-5 py-4 text-base font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
            onclick={() => copy(urlForCrush())}
          >
            {copied ? 'copied!' : 'copy link'}
          </button>
        {/if}
      </div>
      {#if resultHash}
        <div class="space-y-3">
          <pre
            class="overflow-x-auto rounded-xl bg-slate-900 p-5 text-xs leading-relaxed text-blue-300 select-all"
            aria-label="generated link">{urlForCrush()}</pre>
        </div>
      {/if}
    </form>
  </section>
  <section class="px-2 text-sm leading-relaxed opacity-70">
    <p>
      This creates a PBKDF2-SHA256 hash of their Slack ID with a random salt.
      When they enter their ID it checks locally; if it matches, they'll see
      a yes.
    </p>
  </section>
</div>
