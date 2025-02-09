let activeTabs = {};
let wakeLockActive = false;

// При инсталиране на разширението
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({ activeTabs: {}, wakeLockActive: false });
});

// При стартиране на браузъра
chrome.runtime.onStartup.addListener(() => {
    chrome.storage.local.get(["activeTabs", "wakeLockActive"], (data) => {
        const storedActiveTabs = data.activeTabs || {};
        wakeLockActive = data.wakeLockActive || false;

        if (wakeLockActive) {
            console.log("Wake Lock restored: ON");
            chrome.power.requestKeepAwake('display');
        } else {
            console.log("Wake Lock restored: OFF");
        }

        chrome.tabs.query({}, function (tabs) {
            let openTabIds = tabs.map(tab => tab.id);
            let validActiveTabs = {};

            Object.entries(storedActiveTabs).forEach(([tabId, intervalData]) => {
                const numTabId = parseInt(tabId);
                if (openTabIds.includes(numTabId)) {
                    validActiveTabs[tabId] = intervalData;
                    startTabRefresh(numTabId, intervalData.interval);
                }
            });

            chrome.storage.local.set({ activeTabs: validActiveTabs });
        });
    });
});

// Функция за стартиране на опресняването на таб
function startTabRefresh(tabId, interval) {
    activeTabs[tabId] = setInterval(() => {
        chrome.tabs.get(tabId, function (tab) {
            if (chrome.runtime.lastError || !tab || !tab.url || tab.url.match(/^chrome:\/\//)) {
                console.warn(`Tab with id ${tabId} does not exist or is restricted.`);
                clearInterval(activeTabs[tabId]);
                delete activeTabs[tabId];
                return;
            }

            chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: () => location.reload()
            }).catch(err => {
                console.error("Script execution failed:", err);
            });
        });
    }, interval);
}

// Единен listener за съобщения
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "toggleRefresh") {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            let tabId = tabs[0]?.id;
            if (!tabId) return;

            chrome.storage.local.get("activeTabs", (data) => {
                let storedActiveTabs = data.activeTabs || {};

                if (storedActiveTabs[tabId]) {
                    clearInterval(activeTabs[tabId]);
                    delete activeTabs[tabId];
                    delete storedActiveTabs[tabId];

                    chrome.storage.local.set({ activeTabs: storedActiveTabs }, () => {
                        sendResponse({ status: "stopped" });
                    });
                } else {
                    const interval = message.interval || 5000;
                    startTabRefresh(tabId, interval);

                    storedActiveTabs[tabId] = { interval: interval };

                    chrome.storage.local.set({ activeTabs: storedActiveTabs }, () => {
                        sendResponse({ status: "started" });
                    });
                }
            });
        });
        return true;
    }

    if (message.action === "toggleWakeLock") {
        chrome.storage.local.get("wakeLockActive", (data) => {
            wakeLockActive = data.wakeLockActive || false;

            if (!wakeLockActive) {
                chrome.power.requestKeepAwake('display');
                wakeLockActive = true;
                console.log("Wake Lock ENABLED");
            } else {
                chrome.power.releaseKeepAwake();
                wakeLockActive = false;
                console.log("Wake Lock DISABLED");
            }

            chrome.storage.local.set({ wakeLockActive: wakeLockActive }, () => {
                console.log("Wake Lock saved:", wakeLockActive);
                sendResponse({ status: wakeLockActive ? "active" : "inactive" });
            });
        });
        return true;
    }
});
