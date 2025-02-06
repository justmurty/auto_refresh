chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "click") {
        let { x, y } = message;
        let element = document.elementFromPoint(x, y);
        if (element) {
            element.click();
            sendResponse({ success: true });
        } else {
            sendResponse({ success: false, error: "Не е намерен елемент на зададените координати." });
        }
    }
});