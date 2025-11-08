/**
 * Outlook API facade - minimal network calls
 */

export type HandoverRange = "today" | "7d" | "30d" | "60d" | "custom";

export async function startOutlookAuth(userId: string): Promise<never> {
  try {
    if (!userId) {
      throw new Error("User ID is required. Please ensure you are logged in.");
    }

    // Fetch auth URL from server with user_id
    const response = await fetch(`/microsoft-auth?user_id=${encodeURIComponent(userId)}`, {
      method: "GET",
      headers: {
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.success && data.authUrl) {
      console.log("🚀 Opening Microsoft OAuth in new tab:", data.authUrl);

      // Open Microsoft OAuth in new tab
      const authWindow = window.open(data.authUrl, 'microsoft-auth',
        'width=600,height=700,scrollbars=yes,resizable=yes');

      if (!authWindow) {
        // Fallback: redirect in same window if popup blocked
        console.warn("Popup blocked, redirecting in same window");
        window.location.href = data.authUrl;
      } else {
        // Listen for auth completion message
        const messageHandler = (event: MessageEvent) => {
          if (event.data?.type === 'MICROSOFT_AUTH_SUCCESS') {
            console.log("✅ Microsoft auth completed successfully");
            authWindow.close();
            window.removeEventListener('message', messageHandler);
            // TODO: Handle successful auth (refresh status, etc.)
          }
        };

        window.addEventListener('message', messageHandler);

        // Check if window was closed manually (user cancelled)
        // Note: Cross-Origin-Opener-Policy may prevent this check
        const checkClosed = setInterval(() => {
          try {
            if (authWindow.closed) {
              clearInterval(checkClosed);
              window.removeEventListener('message', messageHandler);
              console.log("Auth window closed");
            }
          } catch (e) {
            // Ignore COOP errors, just continue checking
            console.log("COOP policy blocked window.closed check");
          }
        }, 1000);
      }
    } else {
      throw new Error(data.error || "Failed to get auth URL");
    }
  } catch (error) {
    console.error("❌ OAuth initiation failed:", error);
    throw error; // Let caller handle the error
  }

  throw new Error("redirect"); // prevents further execution
}

export async function exportOutlook(payload: {
  range: HandoverRange;
  custom?: { from: string; to: string }; // required when range="custom"
  idempotencyKey?: string;               // recommended
}) {
  const res = await fetch("/export-outlook", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Idempotency-Key": payload.idempotencyKey ?? crypto.randomUUID(),
    },
    body: JSON.stringify(payload),
    credentials: "include",
  });
  if (!res.ok) {
    const e = await res.text().catch(() => "");
    throw new Error(e || `export-outlook failed: ${res.status}`);
  }
  return (await res.json()) as { messageId?: string };
}