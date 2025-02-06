document.addEventListener("DOMContentLoaded", function () {
    const intervalSelect = document.getElementById("interval");
    const customTimeInputs = document.querySelector(".custom-time-inputs");
    const startButton = document.getElementById("start");
    const stopButton = document.getElementById("stop");
    const minutesInput = document.getElementById("minutes");
    const secondsInput = document.getElementById("seconds");
    const errorMessage = document.getElementById("error-message");
    const activeTabsList = document.getElementById("activeTabsList");

    // Зареждаме състоянието на бутоните при отваряне на popup-а
    chrome.storage.local.get(["isStarted", "refreshInterval"], function (data) {
        if (data.isStarted === true) {
            startButton.classList.add("inactive");
            startButton.classList.remove("active");
            stopButton.classList.add("active");
            stopButton.classList.remove("inactive");
        } else {
            startButton.classList.add("active");
            startButton.classList.remove("inactive");
            stopButton.classList.add("inactive");
            stopButton.classList.remove("active");
        }

        if (data.refreshInterval) {
            intervalSelect.value = data.refreshInterval === 5 ? "5" : data.refreshInterval === 10 ? "10" : data.refreshInterval === 15 ? "15" : "custom";
        }
    });

    // Свързваме се с background.js за да получим активните табове
    chrome.runtime.onMessage.addListener((message) => {
        if (message.action === "updateActiveTabs") {
            updateActiveTabsList(message.tabs);
        }
    });

    // Извличаме активни табове от chrome.storage при отваряне на popup
    chrome.storage.local.get("activeTabs", function (data) {
        if (data.activeTabs && data.activeTabs.length > 0) {
            updateActiveTabsList(data.activeTabs);
        } else {
            activeTabsList.innerHTML = "<li>Няма активни табове за рефрешване.</li>";
        }
    });

    function updateActiveTabsList(tabs) {
        activeTabsList.innerHTML = ""; // Изчистваме стария списък
        if (tabs.length === 0) {
            activeTabsList.innerHTML = "<li>Няма активни табове за рефрешване.</li>";
        } else {
            tabs.forEach(tabId => {
                chrome.tabs.get(tabId, function (tab) {
                    const listItem = document.createElement("li");
                    listItem.textContent = tab.title || "Без заглавие";

                    // Добавяме хиксче за премахване на таба
                    const closeButton = document.createElement("span");
                    closeButton.textContent = "✖";
                    closeButton.style.marginLeft = "10px";
                    closeButton.style.cursor = "pointer";
                    closeButton.style.color = "#FF4D4D"; // Червено
                    closeButton.style.fontSize = "14px";

                    // Добавяме хиксче в списъка
                    closeButton.addEventListener("click", function () {
                        removeTab(tabId);
                    });

                    listItem.appendChild(closeButton);
                    activeTabsList.appendChild(listItem);
                });
            });
        }
    }

    function removeTab(tabId) {
        chrome.runtime.sendMessage({ action: "stopTab", tabId: tabId });
        chrome.storage.local.get("activeTabs", function (data) {
            let activeTabs = data.activeTabs || [];
            activeTabs = activeTabs.filter(id => id !== tabId); // Премахваме таба от списъка
            chrome.storage.local.set({ activeTabs: activeTabs }, function () {
                updateActiveTabsList(activeTabs); // Обновяваме списъка с активни табове
            });
        });
    }

    // Логика за избора на интервал
    intervalSelect.addEventListener("change", function () {
        if (intervalSelect.value === "custom") {
            customTimeInputs.classList.add("visible");
            minutesInput.value = 0;
        } else {
            customTimeInputs.classList.remove("visible");
        }
    });

    startButton.addEventListener("click", function () {
        let interval;

        if (intervalSelect.value === "custom") {
            const minutes = parseInt(minutesInput.value);
            const seconds = parseInt(secondsInput.value);

            if (!isNaN(minutes) && !isNaN(seconds) && minutes >= 0 && seconds >= 0) {
                interval = minutes * 60 + seconds;
                chrome.storage.local.set({ refreshInterval: interval, isStarted: true }, function () {
                    chrome.runtime.sendMessage({ action: "start" });
                });
                errorMessage.style.display = "none";
                startButton.classList.add("inactive");
                startButton.classList.remove("active");
                stopButton.classList.add("active");
                stopButton.classList.remove("inactive");
            } else {
                errorMessage.style.display = "block";
                return;
            }
        } else {
            interval = parseInt(intervalSelect.value);
            chrome.storage.local.set({ refreshInterval: interval, isStarted: true }, function () {
                chrome.runtime.sendMessage({ action: "start" });
            });
            startButton.classList.add("inactive");
            startButton.classList.remove("active");
            stopButton.classList.add("active");
            stopButton.classList.remove("inactive");
        }
    });

    stopButton.addEventListener("click", function () {
        chrome.runtime.sendMessage({ action: "stop" });
        chrome.storage.local.set({ isStarted: false }, function () {
            startButton.classList.add("active");
            startButton.classList.remove("inactive");
            stopButton.classList.add("inactive");
            stopButton.classList.remove("active");
        });
    });
});
