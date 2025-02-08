// background.js
let activeTabs = {}; // Object to track active tabs and their intervals

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({ activeTabs: {} });
});

chrome.runtime.onStartup.addListener(() => {
    chrome.storage.local.get("activeTabs", (data) => {
        const storedActiveTabs = data.activeTabs || {};
        
        Object.entries(storedActiveTabs).forEach(([tabId, intervalData]) => {
            const numTabId = parseInt(tabId);
            
            // Restart intervals for saved tabs
            activeTabs[numTabId] = setInterval(() => {
                chrome.tabs.get(numTabId, function (tab) {
                    // Check if tab URL is not a restricted page
                    if (tab && tab.url && !tab.url.match(/^chrome:\/\//) && !tab.url.match(/^edge:\/\//) && !tab.url.match(/^about:\/\//)) {
                        chrome.scripting.executeScript({
                            target: { tabId: numTabId },
                            func: () => location.reload()
                        }).catch(err => {
                            console.error("Script execution failed:", err);
                        });
                    }
                });
            }, intervalData.interval);
        });
    });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "toggleRefresh") {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            let tabId = tabs[0]?.id;
            if (tabId) {
                chrome.storage.local.get("activeTabs", (data) => {
                    let storedActiveTabs = data.activeTabs || {};

                    if (storedActiveTabs[tabId]) {
                        // Stop refresh for this specific tab
                        clearInterval(activeTabs[tabId]);
                        delete activeTabs[tabId];
                        delete storedActiveTabs[tabId];
                        
                        chrome.storage.local.set({ activeTabs: storedActiveTabs }, () => {
                            sendResponse({ status: "stopped" });
                        });
                    } else {
                        // Start refresh for this specific tab
                        const interval = message.interval || 5000; // Default 5 seconds
                        
                        activeTabs[tabId] = setInterval(() => {
                            chrome.tabs.get(tabId, function (tab) {
                                if (tab && tab.url && !tab.url.match(/^chrome:\/\//)) {
                                    chrome.scripting.executeScript({
                                        target: { tabId: tabId },
                                        func: () => location.reload()
                                    });
                                }
                            });
                        }, interval);

                        // Store active tab with its interval
                        storedActiveTabs[tabId] = { interval: interval };
                        
                        chrome.storage.local.set({ activeTabs: storedActiveTabs }, () => {
                            sendResponse({ status: "started" });
                        });
                    }
                });
            }
        });
        return true; // Important: allows asynchronous sendResponse
    }
});

// [[ Keep Screen Awake ]]

let wakeLock = null;

async function requestWakeLock() {
    try {
        wakeLock = await navigator.wakeLock.request('screen');
        console.log('Wake Lock is active.');
    } catch (err) {
        console.error(`${err.name}, ${err.message}`);
    }
}

function releaseWakeLock() {
    if (wakeLock !== null) {
        wakeLock.release()
            .then(() => {
                wakeLock = null;
                console.log('Wake Lock has been released.');
            });
    }
}

chrome.runtime.onInstalled.addListener(() => {
    requestWakeLock();
});

chrome.runtime.onSuspend.addListener(() => {
    releaseWakeLock();
});
