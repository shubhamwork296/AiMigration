(function () {
    const form = document.getElementById("migrationForm");
    const terminal = document.getElementById("terminal");
    const startButton = document.getElementById("startButton");
    const cancelButton = document.getElementById("cancelButton");
    const clearButton = document.getElementById("clearButton");
    const connectionStatus = document.getElementById("connectionStatus");
    const modeButtons = document.querySelectorAll("[data-mode]");
    let migrationMode = "standard";

    const fields = [
        "sourcePath",
        "outputPath",
        "targetArchitecturePath",
        "migrationContextPath",
        "currentTechnology",
        "targetTechnology",
        "currentVersion",
        "targetVersion"
    ];

    function setRunning(isRunning) {
        startButton.disabled = isRunning;
        cancelButton.disabled = !isRunning;
    }

    function appendLine(text, className) {
        const span = document.createElement("span");
        if (className) {
            span.className = className;
        }

        span.textContent = text + "\n";
        terminal.appendChild(span);
        terminal.scrollTop = terminal.scrollHeight;
    }

    function normalizeTechnology(value) {
        if (!value) {
            return "";
        }

        return value.toLowerCase() === "dotnet" ? "DotNet" :
            value.toLowerCase() === "angular" ? "Angular" :
                value;
    }

    function setMode(mode) {
        migrationMode = mode === "legacy" ? "legacy" : "standard";
        document.body.dataset.mode = migrationMode;
        modeButtons.forEach((button) => {
            button.classList.toggle("active", button.dataset.mode === migrationMode);
        });

        if (migrationMode === "legacy") {
            if (!document.getElementById("currentTechnology").value.trim()) {
                document.getElementById("currentTechnology").value = "legacy-webforms";
            }
            if (!document.getElementById("targetTechnology").value.trim()) {
                document.getElementById("targetTechnology").value = "blazor-ssr";
            }
        }
    }

    async function loadDefaults() {
        const response = await fetch("/api/migration/config-defaults");
        if (!response.ok) {
            appendLine("Unable to load migrate.config.json defaults.", "stderr");
            return;
        }

        const defaults = await response.json();
        document.getElementById("sourcePath").value = defaults.sourcePath || "";
        document.getElementById("outputPath").value = defaults.outputPath || "";
        document.getElementById("targetArchitecturePath").value = defaults.targetArchitecturePath || "";
        document.getElementById("migrationContextPath").value = defaults.migrationContextPath || "";
        document.getElementById("currentTechnology").value = normalizeTechnology(defaults.currentTechnology);
        document.getElementById("targetTechnology").value = normalizeTechnology(defaults.targetTechnology);
        document.getElementById("currentVersion").value = defaults.currentVersion || "";
        document.getElementById("targetVersion").value = defaults.targetVersion || "";
        setMode(defaults.migrationMode || "standard");
    }

    modeButtons.forEach((button) => {
        button.addEventListener("click", () => setMode(button.dataset.mode));
    });

    document.querySelectorAll("[data-browse]").forEach((button) => {
        button.addEventListener("click", async () => {
            const target = document.getElementById(button.dataset.browse);
            button.disabled = true;

            try {
                const response = await fetch("/api/migration/browse-folder", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ initialPath: target.value.trim() })
                });

                if (response.status === 204) {
                    return;
                }

                if (!response.ok) {
                    const body = await response.json().catch(() => ({ message: "Folder browse failed." }));
                    appendLine(body.message || "Folder browse failed.", "stderr");
                    return;
                }

                const body = await response.json();
                if (body.path) {
                    target.value = body.path;
                }
            } catch (error) {
                appendLine(error.message || "Folder browse failed.", "stderr");
            } finally {
                button.disabled = false;
            }
        });
    });

    document.querySelectorAll("[data-browse-file]").forEach((button) => {
        button.addEventListener("click", async () => {
            const target = document.getElementById(button.dataset.browseFile);
            button.disabled = true;

            try {
                const response = await fetch("/api/migration/browse-file", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ initialPath: target.value.trim() })
                });

                if (response.status === 204) {
                    return;
                }

                if (!response.ok) {
                    const body = await response.json().catch(() => ({ message: "File browse failed." }));
                    appendLine(body.message || "File browse failed.", "stderr");
                    return;
                }

                const body = await response.json();
                if (body.path) {
                    target.value = body.path;
                }
            } catch (error) {
                appendLine(error.message || "File browse failed.", "stderr");
            } finally {
                button.disabled = false;
            }
        });
    });

    clearButton.addEventListener("click", () => {
        terminal.textContent = "";
    });

    cancelButton.addEventListener("click", async () => {
        const response = await fetch("/api/migration/cancel", { method: "POST" });
        if (!response.ok) {
            const body = await response.json().catch(() => ({ message: "Cancel request failed." }));
            appendLine(body.message || "Cancel request failed.", "stderr");
        }
    });

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        setRunning(true);
        appendLine("> Starting migration...", "status-line");

        const payload = { migrationMode };
        fields.forEach((field) => {
            payload[field] = document.getElementById(field).value.trim();
        });

        const response = await fetch("/api/migration/start", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const body = await response.json().catch(() => ({ message: "Migration could not be started." }));
            appendLine(body.message || "Migration could not be started.", "stderr");
            setRunning(false);
        }
    });

    async function connect() {
        if (!window.signalR) {
            connectionStatus.textContent = "No SignalR";
            appendLine("SignalR client script failed to load.", "stderr");
            return;
        }

        const connection = new signalR.HubConnectionBuilder()
            .withUrl("/migrationHub")
            .withAutomaticReconnect()
            .build();

        connection.on("log", (message) => {
            const prefix = message.stream === "stderr" ? "[stderr] " : "";
            appendLine(prefix + message.line, message.stream === "stderr" ? "stderr" : "");
        });

        connection.on("status", (message) => {
            appendLine("> " + message.message, "status-line");
        });

        connection.on("completed", (message) => {
            appendLine(`> Migration process exited with code ${message.exitCode}.`, "status-line");
            setRunning(false);
        });

        connection.onreconnecting(() => {
            connectionStatus.textContent = "Reconnecting";
            connectionStatus.classList.remove("connected");
        });

        connection.onreconnected(() => {
            connectionStatus.textContent = "Connected";
            connectionStatus.classList.add("connected");
        });

        await connection.start();
        connectionStatus.textContent = "Connected";
        connectionStatus.classList.add("connected");
    }

    loadDefaults();
    connect().catch((error) => {
        connectionStatus.textContent = "Disconnected";
        appendLine(error.message || "SignalR connection failed.", "stderr");
    });
})();
