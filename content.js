chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "click") {
        let x = message.x;
        let y = message.y;
        let element = document.elementFromPoint(x, y);
        if (element) {
            element.click();
        }
    }
});