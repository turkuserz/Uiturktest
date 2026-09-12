// ==========================================
// Credit: DIRECT STORE
// Discord: discord.gg/w4nTsbcCJG
// Website: https://direct-synex.pages.dev/
// ==========================================
(function() {
            window.webViewCallbacks = {};
            let callbackIdCount = 0;

            window.resolveWebViewCallback = function(id, resultStr) {
                if (window.webViewCallbacks[id]) {
                    window.webViewCallbacks[id](resultStr);
                    delete window.webViewCallbacks[id];
                }
            };

            const callNative = function(action, params = {}) {
                return new Promise((resolve) => {
                    const id = ++callbackIdCount;
                    window.webViewCallbacks[id] = resolve;
                    const sendMsg = () => {
                        if (window.chrome && window.chrome.webview && window.chrome.webview.postMessage) {
                            window.chrome.webview.postMessage({
                                action: action,
                                callbackId: id,
                                ...params
                            });
                        } else {
                            setTimeout(sendMsg, 50);
                        }
                    };
                    sendMsg();
                });
            };

            window.pywebview = {
                api: {
                    verify_key: (key) => callNative("verify_key", { key }),
                    load_key: () => callNative("load_key"),
                    get_live_stats: () => callNative("get_live_stats"),
                    clean_ram: () => callNative("clean_ram"),
                    clean_category: (category) => callNative("clean_category", { category }),
                    flush_dns: () => callNative("flush_dns"),
                    flush_winsock: () => callNative("flush_winsock"),
                    run_activated: () => callNative("run_activated"),
                    minimize: () => callNative("minimize"),
                    close: () => callNative("close"),
                    drag_window: () => callNative("drag_window"),
                    check_reshade_status: () => callNative("check_reshade_status"),
                    install_reshade: (include2k) => callNative("install_reshade", { include2k: include2k ? "true" : "false" }),
                    uninstall_reshade: () => callNative("uninstall_reshade"),
                    open_plugins_folder: () => callNative("open_plugins_folder"),
                    run_powershell_command: (script) => callNative("run_powershell_command", { script }),
                    run_powershell_command_encoded: (encoded) => callNative("run_powershell_command_encoded", { encoded }),
                    install_app_real: (appName, dlUrl) => callNative("install_app_real", { appName, dlUrl }),
                    get_activities: () => callNative("get_activities"),
                    add_activity: (name, desc, time) => callNative("add_activity", { name, desc, time }),
                    get_network_adapters: () => callNative("get_network_adapters"),
                    get_motherboard_id: () => callNative("get_motherboard_id"),
                    get_adapter_properties: (adapterGuid, adapterDesc) => callNative("get_adapter_properties", { adapterGuid, adapterDesc }),
                    get_system_settings: () => callNative("get_system_settings"),
                    get_fivem_settings: () => callNative("get_fivem_settings"),
                    log_to_file: (message) => callNative("log_to_file", { message })
                }
            };

            window.addEventListener('DOMContentLoaded', () => {
                const minBtn = document.getElementById('win-min');
                const closeBtn = document.getElementById('win-close');
                const loginMinBtn = document.getElementById('login-min');
                const loginCloseBtn = document.getElementById('login-close');

                if (minBtn) {
                    minBtn.replaceWith(minBtn.cloneNode(true));
                    document.getElementById('win-min')?.addEventListener('click', () => callNative("minimize"));
                }
                if (closeBtn) {
                    closeBtn.replaceWith(closeBtn.cloneNode(true));
                    document.getElementById('win-close')?.addEventListener('click', () => callNative("close"));
                }
                if (loginMinBtn) {
                    loginMinBtn.replaceWith(loginMinBtn.cloneNode(true));
                    document.getElementById('login-min')?.addEventListener('click', () => callNative("minimize"));
                }
                if (loginCloseBtn) {
                    loginCloseBtn.replaceWith(loginCloseBtn.cloneNode(true));
                    document.getElementById('login-close')?.addEventListener('click', () => callNative("close"));
                }

                const loginCard = document.querySelector('.login-card');
                if (loginCard) {
                    loginCard.addEventListener('mousedown', (e) => {
                        if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'A' && !e.target.closest('.window-controls') && !e.target.closest('button') && !e.target.closest('input')) {
                            callNative("drag_window");
                        }
                    });
                }

                const dashboardHeader = document.querySelector('.app-header');
                if (dashboardHeader) {
                    dashboardHeader.addEventListener('mousedown', (e) => {
                        if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'INPUT' && !e.target.closest('.window-controls') && !e.target.closest('.header-controls') && !e.target.closest('button') && !e.target.closest('input')) {
                            callNative("drag_window");
                        }
                    });
                }
            });
        })();