<script lang="ts">
  import { onMount, onDestroy } from "svelte";

  let messages: Array<App.ChatMessage> = $state([]);
  let username: string = $state("");
  let text: string = $state("");
  let loading: boolean = $state(true);
  let interval: ReturnType<typeof setInterval>;

  async function fetchMessages() {
    const res = await fetch("/api/messages");
    messages = await res.json();
    loading = false;
  }

  async function sendMessage() {
    if (!text.trim()) return;

    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, text }),
    });

    text = "";
    await fetchMessages();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  onMount(() => {
    fetchMessages();
    interval = setInterval(fetchMessages, 5000); // poll every 5s
  });

  onDestroy(() => clearInterval(interval));
</script>

<main class="mx-auto flex min-h-screen max-w-2xl flex-col bg-gray-50 p-4">
  <h1 class="mb-4 text-center text-2xl font-bold text-gray-800">Redis Chat</h1>

  <input
    bind:value={username}
    placeholder="Your name"
    class="mb-4 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
  />

  <div
    class="messages mb-4 flex-1 space-y-3 overflow-y-auto rounded-lg bg-white p-4 shadow-sm"
  >
    {#if loading}
      <p class="text-center text-gray-400">Loading...</p>
    {:else if messages.length === 0}
      <p class="text-center text-gray-400">No messages yet. Say something!</p>
    {:else}
      {#each messages as msg (msg.id)}
        <div class="rounded-lg bg-blue-50 p-3">
          <div class="mb-1 flex items-baseline gap-2">
            <strong class="text-sm text-blue-700">{msg.username}</strong>
            <span class="text-xs text-gray-400"
              >{new Date(msg.timestamp).toLocaleTimeString()}</span
            >
          </div>
          <p class="text-gray-700">{msg.text}</p>
        </div>
      {/each}
    {/if}
  </div>

  <div class="flex gap-2">
    <textarea
      bind:value={text}
      onkeydown={handleKeydown}
      placeholder="Type a message... (Enter to send)"
      rows="2"
      class="flex-1 resize-none rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
    ></textarea>
    <button
      onclick={sendMessage}
      class="self-end rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 active:bg-blue-800"
    >
      Send
    </button>
  </div>
</main>
