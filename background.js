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
            chrome.power.requestKeepAwake('display');
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

// Функция за стартиране на опресняването на таб (използва alarms)
function startTabRefresh(tabId, interval) {
    console.log(`Starting refresh for tab ${tabId} every ${interval}ms`);

    // Изчистваме стария аларм, ако съществува
    chrome.alarms.clear(`refresh_${tabId}`);

    activeTabs[tabId] = { interval: interval };

    // Създаваме нов alarm, който ще работи дори когато Service Worker е inactive
    chrome.alarms.create(`refresh_${tabId}`, { periodInMinutes: interval / 60000 });

    chrome.storage.local.set({ activeTabs: activeTabs });
}

// Listener за изпълнение на рефреша при alarm
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name.startsWith("refresh_")) {
        let tabId = parseInt(alarm.name.replace("refresh_", ""));
        chrome.tabs.get(tabId, function (tab) {
            if (chrome.runtime.lastError || !tab || !tab.url || tab.url.match(/^chrome:\/\//)) {
                console.warn(`Tab ${tabId} does not exist.`);
                chrome.alarms.clear(alarm.name);
                delete activeTabs[tabId];
                chrome.storage.local.set({ activeTabs: activeTabs });
                return;
            }

            console.log(`Refreshing tab ${tabId}`);
            chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: () => location.reload()
            }).catch(err => console.error("Script execution failed:", err));
        });
    }
});

// Единен listener за съобщения
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "toggleRefresh") {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            let tabId = tabs[0]?.id;
            if (!tabId) return;

            chrome.storage.local.get("activeTabs", (data) => {
                let storedActiveTabs = data.activeTabs || {};

                if (storedActiveTabs[tabId]) {
                    // Спиране на опресняването
                    chrome.alarms.clear(`refresh_${tabId}`);
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
            } else {
                chrome.power.releaseKeepAwake();
                wakeLockActive = false;
            }

            chrome.storage.local.set({ wakeLockActive: wakeLockActive }, () => {
                sendResponse({ status: wakeLockActive ? "active" : "inactive" });
            });
        });
        return true;
    }
});
