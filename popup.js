// popup.js (modify the existing click handler)
document.addEventListener("DOMContentLoaded", function () {
    const toggleButton = document.getElementById("toggleRefresh");
    const toggleIcon = document.getElementById("toggleIcon");
    const intervalSelect = document.getElementById("timeOption");
    const customTimeInputs = document.getElementById("customTimeInputs");
    const customMinutes = document.getElementById("customMinutes");
    const customSeconds = document.getElementById("customSeconds");
    const errorMessage = document.getElementById("errorMessage");

    // Load saved state when popup opens
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        let currentTabId = tabs[0].id;
        chrome.storage.local.get("activeTabs", function (data) {
            const activeTabs = data.activeTabs || {};
            if (activeTabs[currentTabId]) {
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

    intervalSelect.addEventListener("change", function () {
        if (intervalSelect.value === "custom") {
            customTimeInputs.classList.add("visible");
            customMinutes.value = 0;
        } else {
            customTimeInputs.classList.remove("visible");
        }
    });

    toggleButton.addEventListener("click", function () {
        let interval;

        if (intervalSelect.value === "custom") {
            const minutes = parseInt(customMinutes.value);
            const seconds = parseInt(customSeconds.value);

            if (!isNaN(minutes) && !isNaN(seconds) && minutes >= 0 && seconds >= 0) {
                interval = (minutes * 60 + seconds) * 1000;
                errorMessage.style.display = "none";
            } else {
                errorMessage.style.display = "block";
                return;
            }
        } else {
            interval = parseInt(intervalSelect.value);
        }

        chrome.runtime.sendMessage({ 
            action: "toggleRefresh", 
            interval: interval 
        }, function (response) {
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
});
