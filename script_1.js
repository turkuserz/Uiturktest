// ==========================================
// Credit: DIRECT STORE
// Discord: discord.gg/w4nTsbcCJG
// Website: https://direct-synex.pages.dev/
// ==========================================
window.onerror = function(message, source, lineno, colno, error) {
            const errorStr = "JS Error: " + message + " at " + source + ":" + lineno + ":" + colno;
            if (window.chrome && window.chrome.webview) {
                window.chrome.webview.postMessage({ action: "js_error", error: errorStr });
            }

            const showErr = () => {
                const errDiv = document.createElement('div');
                errDiv.style.position = 'fixed';
                errDiv.style.top = '0';
                errDiv.style.left = '0';
                errDiv.style.right = '0';
                errDiv.style.background = 'red';
                errDiv.style.color = 'white';
                errDiv.style.padding = '10px';
                errDiv.style.zIndex = '10000';
                errDiv.innerText = errorStr;
                document.body.appendChild(errDiv);
            };
            if (document.body) showErr();
            else window.addEventListener('DOMContentLoaded', showErr);
        };

        const logBuffer = [];
        let isNativeLoggingReady = false;

        const logNative = (level, ...args) => {
            const msg = args.map(a => {
                if (a instanceof Error) return a.name + ": " + a.message + "\n" + a.stack;
                return typeof a === 'object' ? JSON.stringify(a) : String(a);
            }).join(' ');
            if (window.chrome && window.chrome.webview && window.chrome.webview.postMessage) {
                window.chrome.webview.postMessage({ action: "console_log", level: level, message: msg });
            } else {
                logBuffer.push({ level: level, msg: msg });
            }
        };

        const flushLogBuffer = () => {
            if (window.chrome && window.chrome.webview && window.chrome.webview.postMessage) {
                while (logBuffer.length > 0) {
                    const entry = logBuffer.shift();
                    window.chrome.webview.postMessage({ action: "console_log", level: entry.level, message: entry.msg });
                }
                isNativeLoggingReady = true;
            } else {
                setTimeout(flushLogBuffer, 100);
            }
        };
        setTimeout(flushLogBuffer, 100);

        console.log = (...args) => logNative("LOG", ...args);
        console.warn = (...args) => logNative("WARN", ...args);
        console.error = (...args) => logNative("ERROR", ...args);

        window.onunhandledrejection = function(event) {
            const errorStr = "Unhandled Promise Rejection: " + event.reason;
            if (window.chrome && window.chrome.webview) {
                window.chrome.webview.postMessage({ action: "js_error", error: errorStr });
            }
        };