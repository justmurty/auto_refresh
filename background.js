let refreshInterval = null;
let activeTabs = []; // Массив с табове, които се рефрешват

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "start") {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            let tabId = tabs[0]?.id;
            if (tabId && !activeTabs.includes(tabId)) {
                activeTabs.push(tabId);
                console.log(`Таб с ID ${tabId} започва да се рефрешва`);
                updateActiveTabs();
                chrome.storage.local.set({ activeTabs: activeTabs }); // Записваме активните табове в chrome.storage
            }
        });

        chrome.storage.local.get("refreshInterval", function (data) {
            if (data.refreshInterval) {
                clearInterval(refreshInterval);
                refreshInterval = setInterval(() => {
                    activeTabs.forEach(tabId => {
                        chrome.tabs.get(tabId, function (tab) {
                            if (tab && tab.url && !tab.url.match(/^chrome:\/\//) && !tab.url.match(/^edge:\/\//)) {
                                chrome.scripting.executeScript({
                                    target: { tabId: tabId },
                                    func: () => location.reload()
                                });
                            }
                        });
                    });
                }, data.refreshInterval * 1000);
            } else {
                console.error("Няма зададена стойност за интервала.");
            }
        });
    } else if (message.action === "stop") {
        clearInterval(refreshInterval);
        activeTabs.forEach(tabId => {
            chrome.tabs.get(tabId, function (tab) {
                if (tab) {
                    console.log(`Таб с ID ${tabId} спира рефрешването`);
                }
            });
        });
        activeTabs = []; // Празним списъка с активни табове
        chrome.storage.local.set({ activeTabs: [] }); // Записваме празен списък
        updateActiveTabs();
    } else if (message.action === "stopTab") {
        // Спираме рефрешването на конкретен таб
        const tabId = message.tabId;
        activeTabs = activeTabs.filter(id => id !== tabId); // Премахваме таба от списъка
        chrome.storage.local.set({ activeTabs: activeTabs }); // Записваме обновен списък
        updateActiveTabs(); // Обновяваме активните табове
    }
});

// Изпращаме активните табове към popup-а, когато се поиска
chrome.runtime.onConnect.addListener(function (port) {
    port.onMessage.addListener(function (msg) {
        if (msg.action === 'getActiveTabs') {
            chrome.storage.local.get("activeTabs", function (data) {
                if (data.activeTabs && data.activeTabs.length > 0) {
                    port.postMessage({ activeTabs: data.activeTabs });
                } else {
                    port.postMessage({ activeTabs: [] });
                }
            });
        }
    });
});

function updateActiveTabs() {
    chrome.runtime.sendMessage({ action: "updateActiveTabs", tabs: activeTabs });
}
