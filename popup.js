document.addEventListener("DOMContentLoaded", function () {
    const toggleButton = document.getElementById("toggleRefresh");
    const toggleIcon = document.getElementById("toggleIcon");
    const intervalButtons = document.querySelectorAll(".interval-btn");
    const customTimeInputs = document.getElementById("customTimeInputs");
    const customMinutes = document.getElementById("customMinutes");
    const customSeconds = document.getElementById("customSeconds");
    const errorMessage = document.getElementById("errorMessage");
    const toggleWakeLock = document.getElementById("toggleWakeLock");
    const wakeLockIcon = document.getElementById("wakeLockIcon");

    let selectedInterval = 5000;
    let currentTabId;

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        currentTabId = tabs[0]?.id;
        if (!currentTabId) return;

        chrome.storage.local.get(["tabIntervals", "activeTabs", "customTimes", "wakeLockActive"], function (data) {
            const tabIntervals = data.tabIntervals || {};
            const activeTabs = data.activeTabs || {};
            const customTimes = data.customTimes || {};
            const wakeLockActive = data.wakeLockActive || false;

            if (tabIntervals[currentTabId]) {
                selectedInterval = tabIntervals[currentTabId];
                intervalButtons.forEach(button => {
                    if (button.dataset.interval === selectedInterval.toString()) {
                        button.classList.add("active");
                    }
                });
            } else {
                intervalButtons[0].classList.add("active");
            }

            if (activeTabs[currentTabId]) {
                toggleButton.classList.remove("green");
                toggleButton.classList.add("red");
                toggleIcon.textContent = "✖";
            }

            if (wakeLockActive) {
                toggleWakeLock.classList.add("active");
                wakeLockIcon.textContent = "☕";
            }

            if (customTimes[currentTabId]) {
                const { minutes, seconds } = customTimes[currentTabId];
                customMinutes.value = minutes;
                customSeconds.value = seconds;
            }

            if (selectedInterval === "custom") {
                customTimeInputs.classList.add("visible");
            }
        });
    });

    function saveCustomTimes() {
        chrome.storage.local.get("customTimes", function (data) {
            const customTimes = data.customTimes || {};
            customTimes[currentTabId] = {
                minutes: parseInt(customMinutes.value) || 0,
                seconds: parseInt(customSeconds.value) || 0
            };
            chrome.storage.local.set({ customTimes: customTimes });
        });
    }

    customMinutes.addEventListener("change", saveCustomTimes);
    customSeconds.addEventListener("change", saveCustomTimes);

    intervalButtons.forEach(button => {
        button.addEventListener("click", function () {
            intervalButtons.forEach(btn => btn.classList.remove("active"));
            button.classList.add("active");

            if (button.dataset.interval === "custom") {
                customTimeInputs.classList.add("visible");
                selectedInterval = "custom";

                chrome.storage.local.get("customTimes", function (data) {
                    const customTimes = data.customTimes || {};
                    const customTime = customTimes[currentTabId] || { minutes: 0, seconds: 0 };
                    customMinutes.value = customTime.minutes;
                    customSeconds.value = customTime.seconds;
                });
            } else {
                customTimeInputs.classList.remove("visible");
                selectedInterval = parseInt(button.dataset.interval);
            }


            chrome.storage.local.get("tabIntervals", function (data) {
                const tabIntervals = data.tabIntervals || {};
                tabIntervals[currentTabId] = selectedInterval;
                chrome.storage.local.set({ tabIntervals: tabIntervals });
            });
        });
    });

    toggleButton.addEventListener("click", function () {
        let interval = selectedInterval;

        if (selectedInterval === "custom") {
            const minutes = parseInt(customMinutes.value);
            const seconds = parseInt(customSeconds.value);

            if (!isNaN(minutes) && !isNaN(seconds) && minutes >= 0 && seconds >= 0) {
                interval = (minutes * 60 + seconds) * 1000;
                errorMessage.style.display = "none";
            } else {
                errorMessage.style.display = "block";
                return;
            }
        }

        chrome.runtime.sendMessage({
            action: "toggleRefresh",
            interval: interval
        }, function (response) {
            if (chrome.runtime.lastError) {
                console.error("Error sending toggleRefresh message:", chrome.runtime.lastError);
                return;
            }

            if (response && response.status === "started") {
                toggleButton.classList.remove("green");
                toggleButton.classList.add("red");
                toggleIcon.textContent = "✖";
            } else {
                toggleButton.classList.add("green");
                toggleButton.classList.remove("red");
                toggleIcon.textContent = "▶";
            }
        });
    });

    toggleWakeLock.addEventListener("click", function () {

        chrome.runtime.sendMessage({
            action: "toggleWakeLock"
        }, function (response) {
            if (chrome.runtime.lastError) {
                return;
            }

            if (response && response.status === "active") {
                toggleWakeLock.classList.add("active");
                wakeLockIcon.textContent = "☕";
            } else {
                toggleWakeLock.classList.remove("active");
                wakeLockIcon.textContent = "🛏️";
            }
        });
    });
});
