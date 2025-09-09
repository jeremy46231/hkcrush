<script lang="ts">
  import { hashVerify } from '$lib/hash'
  import { untrack } from 'svelte'

  let inputId = $state('')
  let verifying = $state(false)
  let verdict: 'idle' | 'yes' | 'no' = $state('idle')
  let storedHash = $state<string | null>(null)
  let error = $state<string | null>(null)
  let mounted = $state(false)
  const STORAGE_KEY = 'hkcrush:slackId'

  // mount + hash change listener
  $effect(() => {
    console.log('mounting')
    mounted = true
    function readHash() {
      try {
        const frag = decodeURIComponent(window.location.hash.slice(1))
        storedHash = frag || null
        // reset state on hash change
        verdict = 'idle'
        error = null
        verifying = false

        untrack(() => {
          if (inputId) {
            check()
          }
        })
      } catch {
        // ignore
      }
    }
    if (typeof window !== 'undefined') {
      readHash()
      window.addEventListener('hashchange', readHash)
      untrack(() => {
        if (!inputId) {
          try {
            const saved = localStorage.getItem(STORAGE_KEY)
            if (saved) inputId = saved
          } catch {}
        }
        if (inputId) {
          check()
        }
      })
    }

    return () => {
      if (typeof window !== 'undefined')
        window.removeEventListener('hashchange', readHash)
    }
  })

  async function check() {
    error = null
    verdict = 'idle'
    if (!storedHash) {
      error = 'Missing hash fragment.'
      return
    }
    if (!inputId.trim()) {
      error = 'Please enter a Slack user ID.'
      return
    }
    // persist entered id
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, inputId.trim())
      }
    } catch {}
    verifying = true
    try {
      const ok = await hashVerify(storedHash, inputId.trim())
      if (!verifying) return // aborted
      verdict = ok ? 'yes' : 'no'
      if (ok) launchConfetti()
    } catch (e) {
      console.error(e)
      error = 'Verification failed'
    } finally {
      verifying = false
    }
  }

  function launchConfetti() {
    try {
      // lightweight confetti - thanks gpt-5
      const colors = ['#ec4899', '#a855f7', '#6366f1', '#f472b6', '#fb923c']
      const count = 120
      for (let i = 0; i < count; i++) {
        const el = document.createElement('div')
        el.className = 'confetti'
        const size = 6 + Math.random() * 6
        el.style.cssText = `position:fixed;top:-10px;left:${Math.random() * 100}vw;width:${size}px;height:${size * 0.6}px;background:${colors[Math.floor(Math.random() * colors.length)]};opacity:${0.7 + Math.random() * 0.3};transform:rotate(${Math.random() * 360}deg);border-radius:2px;pointer-events:none;z-index:50;`
        document.body.appendChild(el)
        const fall = 70 + Math.random() * 30
        const drift = (Math.random() - 0.5) * 40
        const rotate = (Math.random() - 0.5) * 720
        el.animate(
          [
            { transform: el.style.transform, top: '-10px' },
            {
              transform: `translateX(${drift}vw) rotate(${rotate}deg)`,
              top: '110vh',
            },
          ],
          {
            duration: fall * 50,
            easing: 'cubic-bezier(.25,.7,.3,1)',
            delay: Math.random() * 300,
          }
        )
        setTimeout(() => el.remove(), fall * 55)
      }
    } catch (e) {
      console.warn('confetti failed', e)
    }
  }
</script>

<div class="w-full max-w-xl space-y-8">
  <div
    class="space-y-6 rounded-2xl border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70"
  >
    <h2 class="text-2xl font-bold">do they like you?</h2>
    {#if mounted}
      {#if !storedHash}
        <p class="text-base opacity-70">
          No hash found in URL. Ask them for the link.
        </p>
      {:else}
        <form
          class="space-y-6"
          onsubmit={(e) => {
            e.preventDefault()
            check()
          }}
          aria-describedby={error ? 'verify-error' : undefined}
        >
          <label class="block text-lg leading-tight font-medium">
            <span
              class="mb-2 block text-sm font-semibold text-slate-600 dark:text-slate-400"
            >
              your slack id
            </span>
            <input
              placeholder="USLACKBOT"
              class="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 font-mono text-lg tracking-wide focus:border-pink-500 focus:ring-2 focus:ring-pink-500/60 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
              bind:value={inputId}
              maxlength={64}
            />
          </label>
          {#if error}
            <div
              id="verify-error"
              class="text-base font-semibold text-pink-600 dark:text-pink-400"
              role="alert"
              aria-live="polite"
            >
              {error}
            </div>
          {/if}
          <button
            type="submit"
            class="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-pink-500 via-fuchsia-500 to-indigo-500 px-8 py-4 text-lg font-semibold text-white shadow transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
            disabled={verifying || !storedHash}
          >
            {verifying ? 'checking…' : 'check'}
          </button>
          {#if verdict === 'yes'}
            <div class="pt-4 text-center text-4xl font-black">
              <span
                class="bg-gradient-to-r from-pink-500 via-fuchsia-500 to-indigo-500 bg-clip-text text-transparent drop-shadow"
              >
                yes ✨
              </span>
            </div>
            <p class="text-center text-base opacity-70">
              congrats!
            </p>
          {:else if verdict === 'no'}
            <div
              class="pt-4 text-center text-3xl font-bold text-slate-400 dark:text-slate-500"
            >
              nope
            </div>
            <p class="text-center text-sm opacity-60">
              (or maybe they linked your alt account?)
            </p>
          {/if}
        </form>
      {/if}
    {/if}
    <div class="pt-4 text-sm leading-relaxed opacity-70">
      <a href="/" class="underline decoration-dotted hover:decoration-solid">
        make your own link
      </a>
    </div>
  </div>
</div>
