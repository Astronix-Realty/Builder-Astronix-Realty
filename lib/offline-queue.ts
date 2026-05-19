function getStorageKey(): string {
    if (typeof window !== "undefined") {
        const isMandate = window.location.pathname.includes('mandate');
        return isMandate ? 'mandate_crm_offline_queue' : 'builder_crm_offline_queue';
    }
    return 'builder_crm_offline_queue';
}

export async function offlineSafeFetch(url: string, options: RequestInit) {
    if (!navigator.onLine) {
        // Queue it locally
        const key = getStorageKey();
        const queue = JSON.parse(localStorage.getItem(key) || '[]');
        queue.push({ url, options, timestamp: Date.now() });
        localStorage.setItem(key, JSON.stringify(queue));
        
        // Throw an error so the UI knows it was queued, or return a fake success response
        // For optimistic UI, we can return a fake success
        return { ok: true, isOfflineQueued: true, json: async () => ({ success: true, message: "Queued offline" }) };
    }

    try {
        const response = await fetch(url, options);
        if (!response.ok) throw new Error("API Request Failed");
        return response;
    } catch (error) {
        // Fallback queue if fetch fails due to network mid-request
        const key = getStorageKey();
        const queue = JSON.parse(localStorage.getItem(key) || '[]');
        queue.push({ url, options, timestamp: Date.now() });
        localStorage.setItem(key, JSON.stringify(queue));
        return { ok: true, isOfflineQueued: true, json: async () => ({ success: true, message: "Queued offline due to error" }) };
    }
}

// Function to call on 'online' event
export async function syncOfflineQueue() {
    const key = getStorageKey();
    const queue = JSON.parse(localStorage.getItem(key) || '[]');
    if (queue.length === 0) return;

    for (let i = 0; i < queue.length; i++) {
        try {
            await fetch(queue[i].url, queue[i].options);
        } catch (error) {
            console.error("Failed to sync queued request", error);
            // keep remaining items
            localStorage.setItem(key, JSON.stringify(queue.slice(i)));
            return;
        }
    }

    // Success, clear queue
    localStorage.removeItem(key);
}

if (typeof window !== "undefined") {
    window.addEventListener('online', syncOfflineQueue);
}
