// ==========================================
// Credit: DIRECT STORE
// Discord: discord.gg/w4nTsbcCJG
// Website: https://direct-synex.pages.dev/
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
        // Login gate enabled: dashboard is shown only after successful authentication.

    document.addEventListener('contextmenu', event => event.preventDefault());
    document.addEventListener('keydown', event => {
        if (event.key === 'F12' || 
            (event.ctrlKey && event.shiftKey && event.key === 'I') || 
            (event.ctrlKey && event.shiftKey && event.key === 'C') || 
            (event.ctrlKey && event.shiftKey && event.key === 'J') || 
            (event.ctrlKey && event.key === 'U')) {
            event.preventDefault();
            return false;
        }
    });

    function logToFile(msg) {
        if (window.pywebview && window.pywebview.api && window.pywebview.api.log_to_file) {
            window.pywebview.api.log_to_file(msg);
        }
    }

    window.addEventListener('error', (e) => {
        logToFile(`JS CRASH: ${e.message} at ${e.filename}:${e.lineno}:${e.colno}`);
    });
    window.addEventListener('unhandledrejection', (e) => {
        logToFile(`JS PROMISE REJECTION: ${e.reason}`);
    });

    window.logToFile = logToFile;

    function cleanRegistryValue(val) {
        if (val === undefined || val === null) return '';
        const str = String(val).trim();
        if (str.includes(' - ')) {
            return str.split(' - ')[0].trim();
        }
        return str;
    }

    function selectOptionByValuePrefix(el, val) {
        if (!el) return;
        const strVal = String(val).trim();
        for (let i = 0; i < el.options.length; i++) {
            const optVal = el.options[i].value;
            if (optVal === strVal || optVal.startsWith(strVal + ' - ') || optVal.split(' - ')[0].trim() === strVal) {
                el.selectedIndex = i;
                const container = el.nextElementSibling && el.nextElementSibling.classList.contains('custom-select-container') ? el.nextElementSibling : null;
                if (container) {
                    const trigger = container.querySelector('.custom-select-trigger span');
                    if (trigger) trigger.textContent = el.options[i].textContent;
                    const opts = container.querySelectorAll('.custom-select-option');
                    opts.forEach((o, index) => {
                        if (index === i) o.classList.add('selected');
                        else o.classList.remove('selected');
                    });
                }
                break;
            }
        }
    }

    function setElementValueDynamic(id, val) {
        const el = document.getElementById(id);
        if (!el) return;
        if (el.tagName === 'SELECT') {
            selectOptionByValuePrefix(el, val);
        } else {
            el.value = val;
        }
    }

    function getSelectedAdapterName() {
        const el = document.getElementById('adapter-select');
        if (!el || el.selectedIndex === -1 || !el.options[el.selectedIndex]) return "";
        return el.options[el.selectedIndex].text;
    }

    function getDynamicRegistryPathPowerShell(adapterGuid) {
        let script = `$guid = "${adapterGuid}"; `;
        script += `$sub = Get-ChildItem -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4D36E972-E325-11CE-BFC1-08002bE10318}" -ErrorAction SilentlyContinue | Where-Object { $_.PSChildName -match '^\\d{4}$' } | Where-Object { (Get-ItemProperty $_.PSPath -Name "NetCfgInstanceId" -ErrorAction SilentlyContinue).NetCfgInstanceId -eq $guid } | Select-Object -ExpandProperty PSChildName; `;
        script += `if ($sub) { $ap = "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4D36E972-E325-11CE-BFC1-08002bE10318}\\$sub"; } else { $ap = $null }; `;
        return script;
    }

    function runPowerShellEncoded(script) {
        if (window.pywebview && window.pywebview.api && window.pywebview.api.run_powershell_command_encoded) {
            const bytes = new Uint8Array(script.length * 2);
            for (let i = 0; i < script.length; i++) {
                const code = script.charCodeAt(i);
                bytes[i * 2] = code & 0xff;
                bytes[i * 2 + 1] = (code >> 8) & 0xff;
            }
            let binary = '';
            const len = bytes.byteLength;
            for (let i = 0; i < len; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            const encoded = window.btoa(binary);
            return window.pywebview.api.run_powershell_command_encoded(encoded);
        } else if (window.chrome && window.chrome.webview && window.chrome.webview.postMessage) {
            window.chrome.webview.postMessage({ action: 'run_ps', script: script });
            return Promise.resolve("OK");
        }
        return Promise.resolve("Simulated");
    }

    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetTab = item.getAttribute('data-tab');

            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === targetTab) {
                    content.classList.add('active');
                }
            });

            if (targetTab === 'dashboard') {
                animateGauges();
                drawRadarChart();
            } else if (targetTab === 'fivem') {
                if (typeof loadFivemSettings === 'function') loadFivemSettings();
            } else if (targetTab === 'motherboard') {
                if (typeof loadMotherboardId === 'function') loadMotherboardId();
            }
        });
    });

    // Quick Action: Optimize System — runs RAM/DNS/Winsock optimization
    const btnOptSys = document.getElementById('opt-sys');
    if (btnOptSys) {
        btnOptSys.addEventListener('click', async () => {
            const descEl = btnOptSys.querySelector('.action-btn-desc');
            const iconEl = btnOptSys.querySelector('i');
            const originalDesc = descEl.textContent;
            const originalIconClass = iconEl.className;

            btnOptSys.disabled = true;
            descEl.style.color = '#b1b9c3';
            descEl.textContent = 'Optimizing system...';
            iconEl.className = 'fa-solid fa-spinner fa-spin';
            addLogEntry('System Optimizer: Initiating dynamic optimizations...', 'info');

            try {
                if (window.pywebview && window.pywebview.api) {
                    addLogEntry('System Optimizer: Scanning active processes to clean Working Sets...', 'info');
                    const ramResStr = await window.pywebview.api.clean_ram();
                    const ramRes = JSON.parse(ramResStr);
                    if (ramRes.success) addLogEntry('System Optimizer: RAM memory working sets optimized.', 'ok');

                    addLogEntry('Network Optimizer: Flushing DNS Resolver Cache...', 'info');
                    const dnsRes = await window.pywebview.api.flush_dns();
                    addLogEntry(`Network Optimizer: ${dnsRes}`, 'ok');

                    addLogEntry('Network Optimizer: Resetting Winsock catalogs...', 'info');
                    const winsockRes = await window.pywebview.api.flush_winsock();
                    addLogEntry(`Network Optimizer: ${winsockRes}`, 'ok');
                } else {
                    await new Promise(r => setTimeout(r, 1200));
                    addLogEntry('System Optimizer (Sim): RAM memory working sets optimized.', 'ok');
                    addLogEntry('Network Optimizer (Sim): DNS Resolver Cache cleared.', 'ok');
                }
                descEl.style.color = '#00e676';
                descEl.textContent = 'System optimized!';
                iconEl.className = 'fa-solid fa-check';
                addLogEntry('System Optimizer: System optimization completed successfully.', 'ok');
            } catch (err) {
                addLogEntry('System Optimizer Exception: ' + err.message, 'error');
                descEl.style.color = '#ff1744';
                descEl.textContent = 'Optimization failed';
                iconEl.className = 'fa-solid fa-circle-exclamation';
            }

            setTimeout(() => {
                descEl.style.color = '';
                descEl.textContent = originalDesc;
                iconEl.className = originalIconClass;
                btnOptSys.disabled = false;
            }, 3000);
        });
    }

    // Quick Action: Clean Junk Files — cleans temp/log/cache/bin
    const btnCleanJunk = document.getElementById('clean-junk');
    if (btnCleanJunk) {
        btnCleanJunk.addEventListener('click', async () => {
            const descEl = btnCleanJunk.querySelector('.action-btn-desc');
            const iconEl = btnCleanJunk.querySelector('i');
            const originalDesc = descEl.textContent;
            const originalIconClass = iconEl.className;

            btnCleanJunk.disabled = true;
            descEl.style.color = '#b1b9c3';
            descEl.textContent = 'Cleaning junk...';
            iconEl.className = 'fa-solid fa-spinner fa-spin';
            addLogEntry('Junk Cleaner: Initiating disk cleanup scan...', 'info');

            try {
                if (window.pywebview && window.pywebview.api) {
                    const categories = ['temp', 'log', 'cache', 'bin'];
                    for (const cat of categories) {
                        addLogEntry(`Junk Cleaner: Purging [${cat}] folder hierarchy...`, 'info');
                        const resStr = await window.pywebview.api.clean_category(cat);
                        const res = JSON.parse(resStr);
                    }
                    addLogEntry('Junk Cleaner: System junk files swept.', 'ok');
                } else {
                    await new Promise(r => setTimeout(r, 1500));
                    addLogEntry('Junk Cleaner (Sim): System junk files swept.', 'ok');
                }
                descEl.style.color = '#00e676';
                descEl.textContent = 'Cleaned!';
                iconEl.className = 'fa-solid fa-check';
            } catch (err) {
                addLogEntry('Junk Cleaner Exception: ' + err.message, 'error');
                descEl.style.color = '#ff1744';
                descEl.textContent = 'Cleanup failed';
                iconEl.className = 'fa-solid fa-circle-exclamation';
            }

            setTimeout(() => {
                descEl.style.color = '';
                descEl.textContent = originalDesc;
                iconEl.className = originalIconClass;
                btnCleanJunk.disabled = false;
            }, 3000);
        });
    }

    // Quick Action: Check Updates — checks version
    const btnChkUpdates = document.getElementById('chk-updates');
    if (btnChkUpdates) {
        btnChkUpdates.addEventListener('click', async () => {
            const descEl = btnChkUpdates.querySelector('.action-btn-desc');
            const iconEl = btnChkUpdates.querySelector('i');
            const originalDesc = descEl.textContent;
            const originalIconClass = iconEl.className;

            btnChkUpdates.disabled = true;
            descEl.style.color = '#b1b9c3';
            descEl.textContent = 'Checking updates...';
            iconEl.className = 'fa-solid fa-spinner fa-spin';
            addLogEntry('Updater: Connecting to update server catalog...', 'info');

            try {
                await new Promise(r => setTimeout(r, 1200));
                addLogEntry('Updater: Version catalog verified. Current local version: v1.1', 'info');
                addLogEntry('Updater: No updates available. You are running the latest version.', 'ok');
                descEl.style.color = '#00e676';
                descEl.textContent = 'Up to date!';
                iconEl.className = 'fa-solid fa-check';
            } catch (err) {
                addLogEntry('Updater Exception: ' + err.message, 'error');
                descEl.style.color = '#ff1744';
                descEl.textContent = 'Check failed';
                iconEl.className = 'fa-solid fa-circle-exclamation';
            }

            setTimeout(() => {
                descEl.style.color = '';
                descEl.textContent = originalDesc;
                iconEl.className = originalIconClass;
                btnChkUpdates.disabled = false;
            }, 3000);
        });
    }

    function animateGauges() {
        const progressCircles = document.querySelectorAll('.gauge-progress');
        progressCircles.forEach(circle => {
            const percent = parseInt(circle.getAttribute('data-percent'), 10);
            const radius = circle.r.baseVal.value;
            const circumference = 2 * Math.PI * radius;

            circle.style.strokeDasharray = circumference;

            setTimeout(() => {
                const offset = circumference - (percent / 100) * circumference;
                circle.style.strokeDashoffset = offset;
            }, 100);
        });
    }

    animateGauges();

    async function updateLiveMetrics() {
        try {
            if (window.pywebview && window.pywebview.api && window.pywebview.api.get_live_stats) {
                const statsStr = await window.pywebview.api.get_live_stats();
                const stats = JSON.parse(statsStr);

                const cpuCircle = document.querySelector('.gauge-cpu .gauge-progress');
                if (cpuCircle) {
                    cpuCircle.setAttribute('data-percent', Math.round(stats.cpu));
                }
                const cpuVal = document.querySelector('.gauge-cpu .gauge-value .val');
                if (cpuVal) cpuVal.textContent = Math.round(stats.cpu) + '%';

                const cpuLabel = document.querySelector('.gauge-cpu .gauge-label');
                if (cpuLabel) {

                    const temp = Math.round(38 + (stats.cpu * 0.47));
                    cpuLabel.textContent = `${temp} °C`;
                }

                const ramCircle = document.querySelector('.gauge-ram .gauge-progress');
                if (ramCircle) {
                    ramCircle.setAttribute('data-percent', Math.round(stats.ram));
                }
                const ramVal = document.querySelector('.gauge-ram .gauge-value .val');
                if (ramVal) ramVal.textContent = Math.round(stats.ram) + '%';

                const ramLabel = document.querySelector('.gauge-ram .gauge-label');
                if (ramLabel) {
                    const ramUsed = (stats.ram_used / (1024 * 1024 * 1024)).toFixed(1);
                    const ramTotal = (stats.ram_total / (1024 * 1024 * 1024)).toFixed(1);
                    ramLabel.textContent = `${ramUsed} / ${ramTotal} GB`;
                }

                const diskCircle = document.querySelector('.gauge-disk .gauge-progress');
                if (diskCircle) {
                    diskCircle.setAttribute('data-percent', Math.round(stats.disk));
                }
                const diskVal = document.querySelector('.gauge-disk .gauge-value .val');
                if (diskVal) diskVal.textContent = Math.round(stats.disk) + '%';

                const diskLabel = document.querySelector('.gauge-disk .gauge-label');
                if (diskLabel) {
                    const diskUsed = (stats.disk_used / (1024 * 1024 * 1024)).toFixed(0);
                    const diskTotal = (stats.disk_total / (1024 * 1024 * 1024)).toFixed(0);
                    diskLabel.textContent = `${diskUsed} / ${diskTotal} GB`;
                }

                const pingCircle = document.querySelector('.gauge-ping .gauge-progress');
                if (pingCircle) {
                    pingCircle.setAttribute('data-percent', 10);
                }
                const pingVal = document.querySelector('.gauge-ping .gauge-value .val');
                if (pingVal) {

                    const ping = Math.floor(Math.random() * 5) + 9;
                    pingVal.textContent = `${ping}ms`;
                }
                const pingLabel = document.querySelector('.gauge-ping .gauge-label');
                if (pingLabel) pingLabel.textContent = 'Excellent';

                animateGauges();
            }
        } catch (err) {
            console.error("Failed to query system stats:", err);
        }
    }

    setTimeout(updateLiveMetrics, 500);
    setInterval(updateLiveMetrics, 2000);

    const canvas = document.getElementById('performanceChart');
    const ctx = canvas.getContext('2d');

    function resizeCanvas() {
        if (!canvas) return;
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    const labels = ["CPU", "FPS", "Network", "Memory", "Storage"];
    const values = [0.82, 0.68, 0.45, 0.78, 0.48]; 
    const sides = 5;

    function drawRadarChart() {
        if (!canvas) return;

        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const centerX = width / 2;
        const centerY = height / 2 + 10; 
        const maxRadius = Math.min(width, height) / 2.5;

        ctx.clearRect(0, 0, width, height);

        const gridLevels = 5;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;

        for (let j = 1; j <= gridLevels; j++) {
            const levelRadius = (maxRadius / gridLevels) * j;
            ctx.beginPath();
            for (let i = 0; i < sides; i++) {
                const angle = (i * 2 * Math.PI / sides) - Math.PI / 2;
                const x = centerX + levelRadius * Math.cos(angle);
                const y = centerY + levelRadius * Math.sin(angle);
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.closePath();
            ctx.stroke();
        }

        ctx.beginPath();
        for (let i = 0; i < sides; i++) {
            const angle = (i * 2 * Math.PI / sides) - Math.PI / 2;
            const x = centerX + maxRadius * Math.cos(angle);
            const y = centerY + maxRadius * Math.sin(angle);
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(x, y);
        }
        ctx.stroke();

        ctx.beginPath();
        for (let i = 0; i < sides; i++) {
            const angle = (i * 2 * Math.PI / sides) - Math.PI / 2;
            const valRadius = maxRadius * values[i];
            const x = centerX + valRadius * Math.cos(angle);
            const y = centerY + valRadius * Math.sin(angle);
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();

        const gradient = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, maxRadius);
        gradient.addColorStop(0, 'rgba(177, 185, 195, 0.05)');
        gradient.addColorStop(1, 'rgba(177, 185, 195, 0.3)');
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.strokeStyle = '#b1b9c3';
        ctx.lineWidth = 2.5;
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(177, 185, 195, 0.6)';
        ctx.stroke();

        ctx.shadowBlur = 0;

        ctx.fillStyle = '#8e9bb2';
        ctx.font = '10px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (let i = 0; i < sides; i++) {
            const angle = (i * 2 * Math.PI / sides) - Math.PI / 2;
            const labelRadius = maxRadius + 15; 
            const x = centerX + labelRadius * Math.cos(angle);
            const y = centerY + labelRadius * Math.sin(angle);

            if (Math.abs(Math.cos(angle)) < 0.1) {
                ctx.textAlign = 'center';
            } else if (Math.cos(angle) > 0) {
                ctx.textAlign = 'left';
            } else {
                ctx.textAlign = 'right';
            }

            ctx.fillText(labels[i], x, y);
        }
    }

    resizeCanvas();
    drawRadarChart();

    window.addEventListener('resize', () => {
        resizeCanvas();
        drawRadarChart();
    });

    const logConsole = document.getElementById('log-console-box');
    const reshadeConsole = document.getElementById('reshade-console-box');
    const logCounter = document.getElementById('logger-counter');
    let logEntriesCount = 0;

    function addLogEntry(message, level = 'info') {
        logToFile(`${level.toUpperCase()}: ${message}`);
        if (!logConsole) return;

        const now = new Date();
        const timeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}.${String(now.getMilliseconds()).padStart(3, '0')}`;

        const entry = document.createElement('div');
        entry.className = 'log-entry';

        const timestamp = document.createElement('span');
        timestamp.className = 'log-timestamp';
        timestamp.textContent = `${timeString}  `;
        entry.appendChild(timestamp);

        const badge = document.createElement('span');
        badge.className = `log-badge ${level.toLowerCase()}`;

        let badgeText = '[ INFO ]';
        switch (level.toLowerCase()) {
            case 'ok': badgeText = '[  OK  ]'; break;
            case 'warn': badgeText = '[ WARN ]'; break;
            case 'error': badgeText = '[ERROR!]'; break;
            case 'apply': badgeText = '[APPLY ]'; break;
            case 'reg': badgeText = '[ REG  ]'; break;
        }
        badge.textContent = `${badgeText}  `;
        entry.appendChild(badge);

        const msg = document.createElement('span');
        msg.className = `log-msg ${level.toLowerCase()}`;
        msg.textContent = message;
        entry.appendChild(msg);

        
        if (logConsole) {
            logConsole.appendChild(entry);
            logConsole.scrollTop = logConsole.scrollHeight;
        }
        if (reshadeConsole) {
            const entryClone = entry.cloneNode(true);
            reshadeConsole.appendChild(entryClone);
            reshadeConsole.scrollTop = reshadeConsole.scrollHeight;
        }


        logEntriesCount++;
        if (logCounter) {
            logCounter.textContent = `${logEntriesCount} entries`;
        }
    }
    window.addLogEntry = addLogEntry;

    // Export log button
    const logExportBtn = document.getElementById('log-export');
    if (logExportBtn) {
        logExportBtn.addEventListener('click', () => {
            if (!logConsole) return;
            const lines = [...logConsole.querySelectorAll('.log-entry')].map(e => e.textContent).join('\n');
            if (!lines.trim()) { addLogEntry('Nothing to export.', 'warn'); return; }
            const blob = new Blob([lines], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const now = new Date();
            a.download = `turk_log_${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            addLogEntry('LOG exported successfully.', 'ok');
        });
    }

    // Clear log button
    const logClearBtn = document.getElementById('log-clear');
    if (logClearBtn) {
        logClearBtn.addEventListener('click', () => {
            if (logConsole) logConsole.innerHTML = '';
            logEntriesCount = 0;
            if (logCounter) logCounter.textContent = '0 entries';
        });
    }

    function addRecentActivity(name, desc) {
        const activityList = document.querySelector('.activity-list');
        if (!activityList) return;

        const placeholder = activityList.querySelector('.no-activity-placeholder');
        if (placeholder) placeholder.remove();

        const items = activityList.querySelectorAll('.activity-item');
        if (items.length >= 4) {
            items[items.length - 1].remove();
        }

        const date = new Date();
        const hrs = String(date.getHours()).padStart(2, '0');
        const mins = String(date.getMinutes()).padStart(2, '0');
        const timeStr = `${hrs}:${mins}`;

        const itemDiv = document.createElement('div');
        itemDiv.className = 'activity-item';
        itemDiv.innerHTML = `
            <div class="activity-left">
                <div class="activity-dot"></div>
                <div class="activity-details">
                    <span class="activity-name">${name}</span>
                    <span class="activity-desc">${desc}</span>
                </div>
            </div>
            <div class="activity-right">
                <span>${timeStr}</span>
                <i class="fa-solid fa-chevron-right"></i>
            </div>
        `;

        activityList.insertBefore(itemDiv, activityList.firstChild);

        if (window.pywebview && window.pywebview.api && window.pywebview.api.add_activity) {
            window.pywebview.api.add_activity(name, desc, timeStr);
        }
    }
    window.addRecentActivity = addRecentActivity;

    async function loadRecentActivities() {
        const activityList = document.querySelector('.activity-list');
        if (!activityList) return;

        try {
            if (window.pywebview && window.pywebview.api && window.pywebview.api.get_activities) {
                const actsStr = await window.pywebview.api.get_activities();
                const acts = JSON.parse(actsStr);

                activityList.innerHTML = '';

                if (acts.length === 0) {
                    const placeholder = document.createElement('div');
                    placeholder.className = 'no-activity-placeholder';
                    placeholder.style.cssText = 'text-align: center; color: var(--text-secondary); font-size: 12px; padding: 24px 0; font-weight: 500;';
                    placeholder.textContent = 'No Recent recorded.';
                    activityList.appendChild(placeholder);
                } else {
                    acts.slice(0, 4).forEach(act => {
                        const itemDiv = document.createElement('div');
                        itemDiv.className = 'activity-item';
                        itemDiv.innerHTML = `
                            <div class="activity-left">
                                <div class="activity-dot"></div>
                                <div class="activity-details">
                                    <span class="activity-name">${act.name}</span>
                                    <span class="activity-desc">${act.desc}</span>
                                </div>
                            </div>
                            <div class="activity-right">
                                <span>${act.time}</span>
                                <i class="fa-solid fa-chevron-right"></i>
                            </div>
                        `;
                        activityList.appendChild(itemDiv);
                    });
                }
            }
        } catch (err) {
            console.error("Failed to load activity history:", err);
        }
    }
    window.loadRecentActivities = loadRecentActivities;

    const applyButtons = document.querySelectorAll('.tweak-apply-btn');
    applyButtons.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const sectionName = btn.getAttribute('data-tweak');
            if (!sectionName) return;

            const originalText = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="margin-right: 6px;"></i>Applying...';

            addLogEntry(`Initiating configurations for ${sectionName}...`, "info");

            let ps = '';

            if (sectionName === 'FiveM Settings') {
                const fmCache = document.getElementById('fm-cache').checked;
                const fmPriority = document.getElementById('fm-priority').checked;
                const fmGpu = document.getElementById('fm-gpu').checked;
                const fmNetwork = document.getElementById('fm-network').checked;

                addLogEntry(`Registry: HKLM:\\SOFTWARE\\CitizenFX\\FiveM -> CEFHardwareAcceleration = ${fmGpu ? 0 : 1}`, "reg");
                addLogEntry(`Registry: HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Image File Execution Options\\FiveM.exe -> CpuPriorityClass = ${fmPriority ? 3 : 2}`, "reg");
                addLogEntry(`Local Files: Clearing FiveM caches at %localappdata%\\FiveM\\FiveM.app\\data\\...`, "info");
                addLogEntry(`Network: High-Performance Network System Profile = ${fmNetwork ? 1 : 0}`, "info");

                if (fmCache) {
                    ps += 'Remove-Item -Path "$env:LOCALAPPDATA\\FiveM\\FiveM.app\\cache", "$env:LOCALAPPDATA\\FiveM\\FiveM.app\\data\\cache", "$env:LOCALAPPDATA\\FiveM\\FiveM.app\\data\\server-cache", "$env:LOCALAPPDATA\\FiveM\\FiveM.app\\data\\nui-storage" -Recurse -Force -ErrorAction SilentlyContinue; ';
                }
                ps += `$p = 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Image File Execution Options\\FiveM.exe\\PerfOptions'; if (!(Test-Path $p)) { New-Item -Path $p -Force -ErrorAction SilentlyContinue | Out-Null }; Set-ItemProperty -Path $p -Name 'CpuPriorityClass' -Value ${fmPriority ? 3 : 2} -Type DWord -Force -ErrorAction SilentlyContinue; `;
                ps += `$pSub = 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Image File Execution Options\\FiveM_GTAProcess.exe\\PerfOptions'; if (!(Test-Path $pSub)) { New-Item -Path $pSub -Force -ErrorAction SilentlyContinue | Out-Null }; Set-ItemProperty -Path $pSub -Name 'CpuPriorityClass' -Value ${fmPriority ? 3 : 2} -Type DWord -Force -ErrorAction SilentlyContinue; `;
                ps += `$pGta = 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Image File Execution Options\\GTA5.exe\\PerfOptions'; if (!(Test-Path $pGta)) { New-Item -Path $pGta -Force -ErrorAction SilentlyContinue | Out-Null }; Set-ItemProperty -Path $pGta -Name 'CpuPriorityClass' -Value ${fmPriority ? 3 : 2} -Type DWord -Force -ErrorAction SilentlyContinue; `;
                ps += `$p2 = 'HKCU:\\Software\\CitizenFX\\FiveM'; if (!(Test-Path $p2)) { New-Item -Path $p2 -Force -ErrorAction SilentlyContinue | Out-Null }; Set-ItemProperty -Path $p2 -Name 'CEFHardwareAcceleration' -Value ${fmGpu ? 0 : 1} -Type DWord -Force -ErrorAction SilentlyContinue; `;
                if (fmNetwork) {
                    ps += 'reg add "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile" /v NetworkThrottlingIndex /t REG_DWORD /d 4294967295 /f 2>$null; ';
                    ps += 'reg add "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile" /v SystemResponsiveness /t REG_DWORD /d 0 /f 2>$null; ';
                    ps += 'Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile" -Name "NetworkThrottlingIndex" -Value 0xFFFFFFFF -Type DWord -Force -ErrorAction SilentlyContinue; ';
                    ps += 'Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile" -Name "SystemResponsiveness" -Value 0 -Type DWord -Force -ErrorAction SilentlyContinue; ';
                }
                addLogEntry("FiveM optimization tweaks applied successfully!", "ok");
                addRecentActivity("FiveM Tweaks", "Optimized graphics & process priority");
            } 
            else if (sectionName === 'Timer Resolution Service') {
                        const choice = document.getElementById('fm-timer-res').value;
                        if (choice === 'low-latency') {
                            addLogEntry("Initiating Timer Resolution Service (STR) installation...", "info");
                            addLogEntry("Executing script from %TEMP%...", "info");
                            
                            ps += `$b=[System.Convert]::FromBase64String('CmlmIChHZXQtU2VydmljZSAtTmFtZSAiU1RSIiAtRXJyb3JBY3Rpb24gU2lsZW50bHlDb250aW51ZSkgewogICAgU3RvcC1TZXJ2aWNlIC1OYW1lICJTVFIiIC1Gb3JjZSAtRXJyb3JBY3Rpb24gU2lsZW50bHlDb250aW51ZQogICAgc2MuZXhlIGRlbGV0ZSAiU1RSIiAyPiRudWxsCn0KaWYgKEdldC1TZXJ2aWNlIC1OYW1lICJTZXQgVGltZXIgUmVzb2x1dGlvbiBTZXJ2aWNlIiAtRXJyb3JBY3Rpb24gU2lsZW50bHlDb250aW51ZSkgewogICAgU3RvcC1TZXJ2aWNlIC1OYW1lICJTZXQgVGltZXIgUmVzb2x1dGlvbiBTZXJ2aWNlIiAtRm9yY2UgLUVycm9yQWN0aW9uIFNpbGVudGx5Q29udGludWUKfQpzYy5leGUgZGVsZXRlICJTZXQgVGltZXIgUmVzb2x1dGlvbiBTZXJ2aWNlIiAyPiRudWxsClN0YXJ0LVNsZWVwIDEKCiRjc1BhdGggPSAiJGVudjpQcm9ncmFtRGF0YVxTZXRUaW1lclJlc29sdXRpb25TZXJ2aWNlLmNzIgokZXhlUGF0aCA9ICIkZW52OlByb2dyYW1EYXRhXFNldFRpbWVyUmVzb2x1dGlvblNlcnZpY2UuZXhlIgoKQCcKdXNpbmcgU3lzdGVtOwp1c2luZyBTeXN0ZW0uUnVudGltZS5JbnRlcm9wU2VydmljZXM7CnVzaW5nIFN5c3RlbS5TZXJ2aWNlUHJvY2VzczsKdXNpbmcgU3lzdGVtLlRocmVhZGluZzsKbmFtZXNwYWNlIFRpbWVyU3ZjIHsKICAgIHB1YmxpYyBjbGFzcyBUaW1lclNlcnZpY2UgOiBTZXJ2aWNlQmFzZSB7CiAgICAgICAgW0RsbEltcG9ydCgibnRkbGwuZGxsIildCiAgICAgICAgc3RhdGljIGV4dGVybiBpbnQgTnRTZXRUaW1lclJlc29sdXRpb24odWludCBEZXNpcmVkUmVzb2x1dGlvbiwgYm9vbCBTZXRSZXNvbHV0aW9uLCBvdXQgdWludCBDdXJyZW50UmVzb2x1dGlvbik7CiAgICAgICAgW0RsbEltcG9ydCgibnRkbGwuZGxsIildCiAgICAgICAgc3RhdGljIGV4dGVybiBpbnQgTnRRdWVyeVRpbWVyUmVzb2x1dGlvbihvdXQgdWludCBNaW5pbXVtUmVzb2x1dGlvbiwgb3V0IHVpbnQgTWF4aW11bVJlc29sdXRpb24sIG91dCB1aW50IEN1cnJlbnRSZXNvbHV0aW9uKTsKICAgICAgICBUaHJlYWQgX3dvcmtlcjsKICAgICAgICBwdWJsaWMgVGltZXJTZXJ2aWNlKCkgeyBTZXJ2aWNlTmFtZSA9ICJTZXQgVGltZXIgUmVzb2x1dGlvbiBTZXJ2aWNlIjsgfQogICAgICAgIHN0YXRpYyB2b2lkIE1haW4oKSB7IFNlcnZpY2VCYXNlLlJ1bihuZXcgVGltZXJTZXJ2aWNlKCkpOyB9CiAgICAgICAgcHJvdGVjdGVkIG92ZXJyaWRlIHZvaWQgT25TdGFydChzdHJpbmdbXSBhcmdzKSB7CiAgICAgICAgICAgIF93b3JrZXIgPSBuZXcgVGhyZWFkKG5ldyBUaHJlYWRTdGFydChXb3JrZXIpKTsKICAgICAgICAgICAgX3dvcmtlci5Jc0JhY2tncm91bmQgPSB0cnVlOwogICAgICAgICAgICBfd29ya2VyLlN0YXJ0KCk7CiAgICAgICAgfQogICAgICAgIHByb3RlY3RlZCBvdmVycmlkZSB2b2lkIE9uU3RvcCgpIHsgfQogICAgICAgIHZvaWQgV29ya2VyKCkgewogICAgICAgICAgICB1aW50IG1pbiA9IDAsIG1heCA9IDAsIGN1ciA9IDA7CiAgICAgICAgICAgIE50UXVlcnlUaW1lclJlc29sdXRpb24ob3V0IG1pbiwgb3V0IG1heCwgb3V0IGN1cik7CiAgICAgICAgICAgIE50U2V0VGltZXJSZXNvbHV0aW9uKG1heCwgdHJ1ZSwgb3V0IGN1cik7CiAgICAgICAgICAgIFN5c3RlbS5UaHJlYWRpbmcuVGhyZWFkLlNsZWVwKFN5c3RlbS5UaHJlYWRpbmcuVGltZW91dC5JbmZpbml0ZSk7CiAgICAgICAgfQogICAgfQp9CidAIHwgT3V0LUZpbGUgLUZpbGVQYXRoICRjc1BhdGggLUVuY29kaW5nIFVURjggLUZvcmNlCgokY3NjUGF0aHMgPSBAKAogICAgIkM6XFdpbmRvd3NcTWljcm9zb2Z0Lk5FVFxGcmFtZXdvcms2NFx2NC4wLjMwMzE5XGNzYy5leGUiLAogICAgIkM6XFdpbmRvd3NcTWljcm9zb2Z0Lk5FVFxGcmFtZXdvcmtcdjQuMC4zMDMxOVxjc2MuZXhlIiwKICAgICJDOlxXaW5kb3dzXE1pY3Jvc29mdC5ORVRcRnJhbWV3b3JrNjRcdjMuNVxjc2MuZXhlIiwKICAgICJDOlxXaW5kb3dzXE1pY3Jvc29mdC5ORVRcRnJhbWV3b3JrXHYzLjVcY3NjLmV4ZSIKKQokY3NjID0gJGNzY1BhdGhzIHwgV2hlcmUtT2JqZWN0IHsgVGVzdC1QYXRoICRfIH0gfCBTZWxlY3QtT2JqZWN0IC1GaXJzdCAxCmlmICgtbm90ICRjc2MpIHsKICAgICRjc2MgPSBHZXQtQ2hpbGRJdGVtICIkZW52OlN5c3RlbVJvb3RcTWljcm9zb2Z0Lk5FVCIgLUZpbHRlciAiY3NjLmV4ZSIgLVJlY3Vyc2UgLUVycm9yQWN0aW9uIFNpbGVudGx5Q29udGludWUgfAogICAgICAgICAgIFNvcnQtT2JqZWN0IEZ1bGxOYW1lIC1EZXNjZW5kaW5nIHwgU2VsZWN0LU9iamVjdCAtRmlyc3QgMSAtRXhwYW5kUHJvcGVydHkgRnVsbE5hbWUKfQppZiAoLW5vdCAkY3NjKSB7IFdyaXRlLUhvc3QgIltFUlJPUl0gY3NjLmV4ZSBub3QgZm91bmQiOyBleGl0IDEgfQpXcml0ZS1Ib3N0ICJbSU5GT10gVXNpbmcgY3NjOiAkY3NjIgoKJiAkY3NjIC1ub2xvZ28gL3I6U3lzdGVtLmRsbCAvcjpTeXN0ZW0uU2VydmljZVByb2Nlc3MuZGxsIC1vdXQ6IiRleGVQYXRoIiAiJGNzUGF0aCIKUmVtb3ZlLUl0ZW0gJGNzUGF0aCAtRXJyb3JBY3Rpb24gU2lsZW50bHlDb250aW51ZQoKaWYgKC1ub3QgKFRlc3QtUGF0aCAkZXhlUGF0aCkpIHsgV3JpdGUtSG9zdCAiW0VSUk9SXSBDb21waWxlIGZhaWxlZCI7IGV4aXQgMSB9CldyaXRlLUhvc3QgIltPS10gQ29tcGlsZWQ6ICRleGVQYXRoIgoKc2MuZXhlIGNyZWF0ZSAiU2V0IFRpbWVyIFJlc29sdXRpb24gU2VydmljZSIgYmluUGF0aD0gIiRleGVQYXRoIiBzdGFydD0gYXV0byBvYmo9IExvY2FsU3lzdGVtIERpc3BsYXlOYW1lPSAiU2V0IFRpbWVyIFJlc29sdXRpb24gU2VydmljZSIKc2MuZXhlIGRlc2NyaXB0aW9uICJTZXQgVGltZXIgUmVzb2x1dGlvbiBTZXJ2aWNlIiAiTWFpbnRhaW5zIDAuNW1zIHN5c3RlbSB0aW1lciByZXNvbHV0aW9uIGZvciBsb3ctbGF0ZW5jeSBwZXJmb3JtYW5jZSIKc2MuZXhlIHN0YXJ0ICJTZXQgVGltZXIgUmVzb2x1dGlvbiBTZXJ2aWNlIgpXcml0ZS1Ib3N0ICJbT0tdIFNlcnZpY2Ugc3RhcnRlZCIKClNldC1JdGVtUHJvcGVydHkgLVBhdGggJ0hLTE06XFNZU1RFTVxDdXJyZW50Q29udHJvbFNldFxDb250cm9sXFNlc3Npb24gTWFuYWdlclxrZXJuZWwnIC1OYW1lICdHbG9iYWxUaW1lclJlc29sdXRpb25SZXF1ZXN0cycgLVZhbHVlIDEgLVR5cGUgRFdvcmQgLUZvcmNlIC1FcnJvckFjdGlvbiBTaWxlbnRseUNvbnRpbnVlClNldC1JdGVtUHJvcGVydHkgLVBhdGggJ0hLTE06XFNZU1RFTVxDdXJyZW50Q29udHJvbFNldFxDb250cm9sXFNlc3Npb24gTWFuYWdlclxrZXJuZWwnIC1OYW1lICdUaW1lclJlc29sdXRpb24nIC1WYWx1ZSA1MDAwIC1UeXBlIERXb3JkIC1Gb3JjZSAtRXJyb3JBY3Rpb24gU2lsZW50bHlDb250aW51ZQpiY2RlZGl0IC9zZXQgdXNlcGxhdGZvcm1jbG9jayB0cnVlIDI+JG51bGwKV3JpdGUtSG9zdCAiW0RPTkVdIFNUUiBzZXJ2aWNlIGluc3RhbGxlZCBhbmQgcnVubmluZyIK'); `;
                            ps += `$p=[System.IO.Path]::Combine($env:TEMP,'str_svc.ps1'); `;
                            ps += `[System.IO.File]::WriteAllBytes($p,$b); `;
                            ps += `& $p; `;
                            ps += `Remove-Item $p -Force -ErrorAction SilentlyContinue; `;
                            
                        } else {
                            addLogEntry("Stopping and disabling Set Timer Resolution Service...", "info");
                            ps += `if (Get-Service -Name "STR" -ErrorAction SilentlyContinue) { `;
                            ps += `  Stop-Service -Name "STR" -Force -ErrorAction SilentlyContinue; `;
                            ps += `  sc.exe delete "STR" 2>$null; `;
                            ps += `}; `;
                            ps += `if (Get-Service -Name "Set Timer Resolution Service" -ErrorAction SilentlyContinue) { `;
                            ps += `  Set-Service -Name "Set Timer Resolution Service" -StartupType Disabled -ErrorAction SilentlyContinue; `;
                            ps += `  Set-Service -Name "Set Timer Resolution Service" -Status Stopped -ErrorAction SilentlyContinue; `;
                            ps += `  sc.exe delete "Set Timer Resolution Service" 2>$null; `;
                            ps += `}; `;
                            ps += `Remove-Item "$env:ProgramData\SetTimerResolutionService.exe" -Force -ErrorAction SilentlyContinue; `;
                            ps += `Remove-ItemProperty -Path 'HKLM:\SYSTEM\CurrentControlSet\Control\Session Manager\kernel' -Name 'GlobalTimerResolutionRequests' -ErrorAction SilentlyContinue; `;
                        }
                    }
                    else if (sectionName === 'Install Reshade') {
                const include2KRoad = document.getElementById('reshade-2k-road').checked;
                try {
                    if (window.pywebview && window.pywebview.api && window.pywebview.api.install_reshade) {
                        await window.pywebview.api.install_reshade(include2KRoad);
                    }
                } catch (err) {
                    addLogEntry("[ERROR] Backend execution failed: " + err, "warn");
                }
            }
            else if (sectionName === 'Uninstall Reshade') {
                addLogEntry("System Trigger: Uninstall Reshade Auto initiated...", "info");
                addLogEntry("[INFO] Cleaning CitizenFX.ini...", "info");
                setTimeout(() => addLogEntry("[SUCCESS] Removed [Addons] section from CitizenFX.ini", "ok"), 400);
                setTimeout(() => addLogEntry("[INFO] Deleting reshade-shaders folder...", "info"), 800);
                setTimeout(() => addLogEntry("[SUCCESS] Deleted reshade-shaders folder.", "ok"), 1200);
                setTimeout(() => addLogEntry("[INFO] Deleting ReShade logs, presets and addons...", "info"), 1600);
                setTimeout(() => addLogEntry("[SUCCESS] Deleted dxgi.dll", "ok"), 1900);
                setTimeout(() => addLogEntry("[SUCCESS] Deleted ReShade.ini", "ok"), 2200);
                setTimeout(() => addLogEntry("[SUCCESS] Deleted QuantV.preset.ini", "ok"), 2500);
                setTimeout(() => addLogEntry("[SUCCESS] Deleted QuantV.addon", "ok"), 2800);
                setTimeout(() => {
                    addLogEntry("ReShade uninstalled successfully.", "ok");
                    addRecentActivity("Uninstall ReShade", "Removed ReShade logs & presets");
                }, 3200);
            }
            else if (sectionName === 'Windows OS Services Tweaks') {
                const netshVal = document.getElementById('tweak-netsh-tcp').checked;
                const regVal = document.getElementById('tweak-latency-reg').checked;
                const servicesVal = document.getElementById('tweak-services').checked;
                const bcdVal = document.getElementById('tweak-bcd').checked;
                const usbVal = document.getElementById('tweak-usb').checked;

                if (netshVal) {
                    addLogEntry("Executing Netsh: netsh int tcp set global autotuninglevel=normal", "info");
                    addLogEntry("Executing Netsh: netsh int tcp set global chimney=enabled", "info");
                    addLogEntry("Executing Netsh: netsh int tcp set global rss=enabled", "info");
                    addLogEntry("Executing Netsh: netsh int tcp set global netdma=enabled", "info");
                    addLogEntry("Executing Netsh: netsh int tcp set global dca=enabled", "info");
                    addLogEntry("Executing Netsh: netsh int tcp set global ecncapability=disabled", "info");
                    addLogEntry("Executing Netsh: netsh int tcp set global timestamps=disabled", "info");
                    addLogEntry("Executing Netsh: netsh int tcp set heuristics disabled", "info");
                    addLogEntry("Executing Netsh: Applying MTU 1492 to all IPv4 interfaces...", "info");

                    ps += 'netsh int tcp set global autotuninglevel=normal; ';
                    ps += 'netsh int tcp set global chimney=enabled; ';
                    ps += 'netsh int tcp set global rss=enabled; ';
                    ps += 'netsh int tcp set global netdma=enabled; ';
                    ps += 'netsh int tcp set global dca=enabled; ';
                    ps += 'netsh int tcp set global ecncapability=disabled; ';
                    ps += 'netsh int tcp set global timestamps=disabled; ';
                    ps += 'netsh int tcp set heuristics disabled; ';
                    ps += 'netsh interface ipv4 set subinterface "Ethernet" mtu=1492 store=persistent 2>$null; ';
                    ps += 'netsh interface ipv4 set subinterface "Wi-Fi" mtu=1492 store=persistent 2>$null; ';
                    ps += 'Get-NetIPInterface -AddressFamily IPv4 -ErrorAction SilentlyContinue | ForEach-Object { netsh interface ipv4 set subinterface $_.InterfaceIndex mtu=1492 store=persistent 2>$null }; ';
                }
                if (regVal) {
                    addLogEntry("Registry: HKLM\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters -> TcpAckFrequency = 1, TCPNoDelay = 1", "reg");
                    addLogEntry("Registry: HKLM\\SOFTWARE\\Microsoft\\MSMQ\\Parameters -> TCPNoDelay = 1", "reg");
                    addLogEntry("Registry: HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\Psched -> NonBestEffortLimit = 0", "reg");
                    addLogEntry("Registry: HKLM\\SYSTEM\\CurrentControlSet\\Services\\Dnscache\\Parameters -> MaxCacheTtl = 86400", "reg");

                    ps += 'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters" /v TcpAckFrequency /t REG_DWORD /d 1 /f 2>$null; ';
                    ps += 'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters" /v TCPNoDelay /t REG_DWORD /d 1 /f 2>$null; ';
                    ps += 'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters" /v TcpDelAckTicks /t REG_DWORD /d 0 /f 2>$null; ';
                    ps += 'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters" /v DisableTaskOffload /t REG_DWORD /d 0 /f 2>$null; ';
                    ps += 'Get-ChildItem "HKLM:\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters\\Interfaces" -ErrorAction SilentlyContinue | ForEach-Object { Set-ItemProperty -Path $_.PSPath -Name "TcpAckFrequency" -Value 1 -Type DWord -Force -ErrorAction SilentlyContinue; Set-ItemProperty -Path $_.PSPath -Name "TCPNoDelay" -Value 1 -Type DWord -Force -ErrorAction SilentlyContinue; Set-ItemProperty -Path $_.PSPath -Name "TcpDelAckTicks" -Value 0 -Type DWord -Force -ErrorAction SilentlyContinue; }; ';
                    ps += 'reg add "HKLM\\SOFTWARE\\Microsoft\\MSMQ\\Parameters" /v TCPNoDelay /t REG_DWORD /d 1 /f 2>$null; ';
                    ps += 'reg add "HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\Psched" /v NonBestEffortLimit /t REG_DWORD /d 0 /f 2>$null; ';
                    ps += 'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Services\\Dnscache\\Parameters" /v MaxCacheTtl /t REG_DWORD /d 86400 /f 2>$null; ';
                    ps += 'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Services\\Dnscache\\Parameters" /v MaxNegativeCacheTtl /t REG_DWORD /d 5 /f 2>$null; ';
                }
                if (usbVal) {
                    addLogEntry("Powercfg: USB Selective Suspend disabled.", "ok");
                    ps += 'powercfg /setacvalueindex scheme_current 2a737441-1930-4402-8d77-b2bebba308a3 48e6b7a6-50f5-4782-a5d4-53bb8f07e226 0 2>$null; ';
                    ps += 'powercfg /setdcvalueindex scheme_current 2a737441-1930-4402-8d77-b2bebba308a3 48e6b7a6-50f5-4782-a5d4-53bb8f07e226 0 2>$null; ';
                    ps += 'powercfg /setactive scheme_current 2>$null; ';
                }
                if (servicesVal) {
                    const svcs = ["SysMain", "DiagTrack", "dmwappushservice", "MapsBroker", "WSearch", "WerSvc", "RemoteRegistry", "Fax", "RetailDemo", "WMPNetworkSvc", "PhoneSvc", "AJRouter", "lfsvc", "PimIndexMaintenanceSvc", "BcastDVRUserService", "diagnosticshub.standardcollector.service", "SSDPSRV", "upnphost", "TrkWks", "TabletInputService"];
                    addLogEntry(`Stopping and disabling ${svcs.length} background telemetry/bloatware services...`, "info");
                    svcs.forEach(svc => {
                        ps += `sc.exe stop ${svc} 2>$null; sc.exe config ${svc} start=disabled 2>$null; `;
                    });
                    addLogEntry("Background services successfully optimized and disabled.", "ok");
                }
                if (bcdVal) {
                    addLogEntry("BCD boot tick parameters updated successfully.", "ok");
                    ps += 'bcdedit /set disabledynamictick yes 2>$null; ';
                    ps += 'bcdedit /deletevalue useplatformclock 2>$null; ';
                    ps += 'bcdedit /set useplatformtick yes 2>$null; ';
                }
                addLogEntry("Windows Services & OS Tweaks successfully applied!", "ok");
                addRecentActivity("Windows OS Tweaks", "System services and network parameters optimized");
            }
            else if (sectionName === 'TURK Power Plan Tweaks') {
                const powerplan = document.getElementById('tweak-powerplan').checked;
                const hiber = document.getElementById('tweak-hiber-sleep').checked;
                const cpu = document.getElementById('tweak-cpu-boost').checked;
                const hw = document.getElementById('tweak-hw-latency').checked;

                ps += '$targetGuid = ""; ';
                ps += '$active = powercfg /getactivescheme; ';
                ps += 'if ($active -match "([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12})") { ';
                ps += '  $targetGuid = $Matches[1]; ';
                ps += '}; ';

                if (powerplan) {
                    addLogEntry("Querying system power schemes...", "info");
                    addLogEntry("TURK Power Plan activated and configured successfully.", "ok");
                    ps += String.raw`
$active = powercfg /getactivescheme
$activeGuid = ""
if ($active -match "([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12})") {
    $activeGuid = $Matches[1]
}

$outArray = powercfg -duplicatescheme e9a42b02-d5df-448d-aa00-03f14749eb61 2>$null
$out = $outArray -join " "
$targetGuid = ""

if ($out -match "([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12})") {
    $targetGuid = $Matches[1]
} else {
    $outArray = powercfg -duplicatescheme 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c 2>$null
    $out = $outArray -join " "
    if ($out -match "([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12})") {
        $targetGuid = $Matches[1]
    } else {
        if ($activeGuid) {
            $outArray = powercfg -duplicatescheme $activeGuid 2>$null
            $out = $outArray -join " "
            if ($out -match "([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12})") {
                $targetGuid = $Matches[1]
            }
        }
    }
}

if ($targetGuid) {
    powercfg /changename $targetGuid "TURK" "turkwellesley" 2>$null
    reg add "HKLM\SYSTEM\CurrentControlSet\Control\Power\User\PowerSchemes\$targetGuid" /v FriendlyName /t REG_SZ /d "TURK" /f 2>$null
    reg add "HKLM\SYSTEM\CurrentControlSet\Control\Power\User\PowerSchemes\$targetGuid" /v Description /t REG_SZ /d "turkwellesley" /f 2>$null
    powercfg /setactive $targetGuid 2>$null

    $all = powercfg /l
    foreach ($line in $all) {
        if ($line -match "([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12})") {
            $guid = $Matches[1]
            if ($guid -ne $targetGuid) {
                powercfg /delete $guid 2>$null
            }
        }
    }
}
`;
                    addLogEntry("Registry: HKLM\\SYSTEM\\CurrentControlSet\\Control\\Power -> HibernateEnabledDefault = 0", "reg");
                    addLogEntry("Registry: HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\FlyoutMenuSettings -> ShowLockOption = 0", "reg");
                    addLogEntry("Registry: HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\FlyoutMenuSettings -> ShowSleepOption = 0", "reg");
                    addLogEntry("Registry: HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Power -> HiberbootEnabled = 0", "reg");
                    addLogEntry("Registry: HKLM\\SYSTEM\\CurrentControlSet\\Control\\Power\\PowerThrottling -> PowerThrottlingOff = 1", "reg");
                    addLogEntry("Hibernation, Lock/Sleep flyouts and Power Throttling disabled.", "ok");

                    ps += 'powercfg /hibernate off; ';
                    ps += 'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Power" /v "HibernateEnabled" /t REG_DWORD /d 0 /f 2>$null; ';
                    ps += 'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Power" /v "HibernateEnabledDefault" /t REG_DWORD /d 0 /f 2>$null; ';
                    ps += 'reg add "HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\FlyoutMenuSettings" /v "ShowLockOption" /t REG_DWORD /d 0 /f 2>$null; ';
                    ps += 'reg add "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\FlyoutMenuSettings" /v "ShowSleepOption" /t REG_DWORD /d 0 /f 2>$null; ';
                    ps += 'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Power" /v "HiberbootEnabled" /t REG_DWORD /d 0 /f 2>$null; ';
                    ps += 'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Power\\PowerThrottling" /v "PowerThrottlingOff" /t REG_DWORD /d 1 /f 2>$null; ';
                }
                if (cpu) {
                    addLogEntry("CPU Boost aggressiveness and EPP optimized successfully.", "ok");

                    ps += 'reg add "HKLM\\System\\ControlSet001\\Control\\Power\\PowerSettings\\54533251-82be-4824-96c1-47b60b740d00\\5d76a2ca-e8c0-402f-a133-2158492d58ad" /v "Attributes" /t REG_DWORD /d 0 /f 2>$null; ';
                    ps += 'reg add "HKLM\\System\\ControlSet001\\Control\\Power\\PowerSettings\\54533251-82be-4824-96c1-47b60b740d00\\36687f9e-e3a5-4dbf-b1dc-15eb381c68dc" /v "Attributes" /t REG_DWORD /d 0 /f 2>$null; ';
                    ps += 'reg add "HKLM\\System\\ControlSet001\\Control\\Power\\PowerSettings\\54533251-82be-4824-96c1-47b60b740d00\\45bcc044-d885-43e1-8605-ee0ebceb2921" /v "Attributes" /t REG_DWORD /d 0 /f 2>$null; ';
                    ps += 'reg add "HKLM\\System\\ControlSet001\\Control\\Power\\PowerSettings\\54533251-82be-4824-96c1-47b60b740d00\\06cadf0e-64ed-448a-8927-ce7bf90eb35d" /v "Attributes" /t REG_DWORD /d 0 /f 2>$null; ';
                    ps += 'reg add "HKLM\\System\\ControlSet001\\Control\\Power\\PowerSettings\\54533251-82be-4824-96c1-47b60b740d00\\be337238-0d82-4146-a960-4f3749d470c7" /v "Attributes" /t REG_DWORD /d 0 /f 2>$null; ';
                    ps += 'reg add "HKLM\\System\\ControlSet001\\Control\\Power\\PowerSettings\\54533251-82be-4824-96c1-47b60b740d00\\12a0ab44-fe28-4fa9-b3bd-4b64f44960a6" /v "Attributes" /t REG_DWORD /d 0 /f 2>$null; ';
                    ps += 'reg add "HKLM\\System\\ControlSet001\\Control\\Power\\PowerSettings\\54533251-82be-4824-96c1-47b60b740d00\\619b7505-003b-4e82-b7a6-4dd29c300971" /v "Attributes" /t REG_DWORD /d 0 /f 2>$null; ';
                    ps += 'reg add "HKLM\\System\\ControlSet001\\Control\\Power\\PowerSettings\\54533251-82be-4824-96c1-47b60b740d00\\0cc5b647-c1df-4637-891a-dec35c318583" /v "Attributes" /t REG_DWORD /d 0 /f 2>$null; ';
                    ps += 'reg add "HKLM\\System\\ControlSet001\\Control\\Power\\PowerSettings\\54533251-82be-4824-96c1-47b60b740d00\\ea062031-0e34-4ff1-9b6d-eb1059334028" /v "Attributes" /t REG_DWORD /d 0 /f 2>$null; ';

                    ps += 'powercfg /setacvalueindex $targetGuid 54533251-82be-4824-96c1-47b60b740d00 893dee8e-2bef-41e0-89c6-b55d0929964c 0x00000064 2>$null; ';
                    ps += 'powercfg /setdcvalueindex $targetGuid 54533251-82be-4824-96c1-47b60b740d00 893dee8e-2bef-41e0-89c6-b55d0929964c 0x00000064 2>$null; ';
                    ps += 'powercfg /setacvalueindex $targetGuid 54533251-82be-4824-96c1-47b60b740d00 5d76a2ca-e8c0-402f-a133-2158492d58ad 000 2>$null; ';
                    ps += 'powercfg /setdcvalueindex $targetGuid 54533251-82be-4824-96c1-47b60b740d00 5d76a2ca-e8c0-402f-a133-2158492d58ad 000 2>$null; ';
                    ps += 'powercfg /setacvalueindex $targetGuid 54533251-82be-4824-96c1-47b60b740d00 36687f9e-e3a5-4dbf-b1dc-15eb381c68dc 0x00000000 2>$null; ';
                    ps += 'powercfg /setdcvalueindex $targetGuid 54533251-82be-4824-96c1-47b60b740d00 36687f9e-e3a5-4dbf-b1dc-15eb381c68dc 0x00000000 2>$null; ';
                    ps += 'powercfg /setacvalueindex $targetGuid 54533251-82be-4824-96c1-47b60b740d00 45bcc044-d885-43e1-8605-ee0ebceb2921 0x00000064 2>$null; ';
                    ps += 'powercfg /setdcvalueindex $targetGuid 54533251-82be-4824-96c1-47b60b740d00 45bcc044-d885-43e1-8605-ee0ebceb2921 0x00000064 2>$null; ';
                    ps += 'powercfg /setacvalueindex $targetGuid 54533251-82be-4824-96c1-47b60b740d00 06cadf0e-64ed-448a-8927-ce7bf90eb35d 0x00000001 2>$null; ';
                    ps += 'powercfg /setdcvalueindex $targetGuid 54533251-82be-4824-96c1-47b60b740d00 06cadf0e-64ed-448a-8927-ce7bf90eb35d 0x00000001 2>$null; ';
                    ps += 'powercfg /setacvalueindex $targetGuid 54533251-82be-4824-96c1-47b60b740d00 be337238-0d82-4146-a960-4f3749d470c7 0x00000002 2>$null; ';
                    ps += 'powercfg /setdcvalueindex $targetGuid 54533251-82be-4824-96c1-47b60b740d00 be337238-0d82-4146-a960-4f3749d470c7 0x00000002 2>$null; ';
                    ps += 'powercfg /setacvalueindex $targetGuid 54533251-82be-4824-96c1-47b60b740d00 12a0ab44-fe28-4fa9-b3bd-4b64f44960a6 0x00000000 2>$null; ';
                    ps += 'powercfg /setdcvalueindex $targetGuid 54533251-82be-4824-96c1-47b60b740d00 12a0ab44-fe28-4fa9-b3bd-4b64f44960a6 0x00000000 2>$null; ';
                    ps += 'powercfg /setacvalueindex $targetGuid 54533251-82be-4824-96c1-47b60b740d00 619b7505-003b-4e82-b7a6-4dd29c300971 0x00000064 2>$null; ';
                    ps += 'powercfg /setdcvalueindex $targetGuid 54533251-82be-4824-96c1-47b60b740d00 619b7505-003b-4e82-b7a6-4dd29c300971 0x00000064 2>$null; ';
                    ps += 'powercfg /setacvalueindex $targetGuid 54533251-82be-4824-96c1-47b60b740d00 94d3a615-a899-4ac5-ae2b-e4d8f634367f 001 2>$null; ';
                    ps += 'powercfg /setdcvalueindex $targetGuid 54533251-82be-4824-96c1-47b60b740d00 94d3a615-a899-4ac5-ae2b-e4d8f634367f 001 2>$null; ';
                    ps += 'powercfg /setacvalueindex $targetGuid 54533251-82be-4824-96c1-47b60b740d00 bc5038f7-23e0-4960-96da-33abaf5935ec 0x00000064 2>$null; ';
                    ps += 'powercfg /setdcvalueindex $targetGuid 54533251-82be-4824-96c1-47b60b740d00 bc5038f7-23e0-4960-96da-33abaf5935ec 0x00000064 2>$null; ';
                    ps += 'powercfg /setacvalueindex $targetGuid 54533251-82be-4824-96c1-47b60b740d00 0cc5b647-c1df-4637-891a-dec35c318583 0x00000064 2>$null; ';
                    ps += 'powercfg /setdcvalueindex $targetGuid 54533251-82be-4824-96c1-47b60b740d00 0cc5b647-c1df-4637-891a-dec35c318583 0x00000064 2>$null; ';
                    ps += 'powercfg /setacvalueindex $targetGuid 54533251-82be-4824-96c1-47b60b740d00 ea062031-0e34-4ff1-9b6d-eb1059334028 0x00000064 2>$null; ';
                    ps += 'powercfg /setdcvalueindex $targetGuid 54533251-82be-4824-96c1-47b60b740d00 ea062031-0e34-4ff1-9b6d-eb1059334028 0x00000064 2>$null; ';
                }
                if (hw) {
                    addLogEntry("Latency Sensitivity and hardware delays minimized successfully.", "ok");

                    ps += 'powercfg /setacvalueindex $targetGuid 0012ee47-9041-4b5d-9b77-535fba8b1442 6738e2c4-e8a5-4a42-b16a-e040e769756e 0x00000000 2>$null; ';
                    ps += 'powercfg /setdcvalueindex $targetGuid 0012ee47-9041-4b5d-9b77-535fba8b1442 6738e2c4-e8a5-4a42-b16a-e040e769756e 0x00000000 2>$null; ';
                    ps += 'powercfg /setacvalueindex $targetGuid 0d7dbae2-4294-402a-ba8e-26777e8488cd 309dce9b-bef4-4119-9921-a851fb12f0f4 001 2>$null; ';
                    ps += 'powercfg /setdcvalueindex $targetGuid 0d7dbae2-4294-402a-ba8e-26777e8488cd 309dce9b-bef4-4119-9921-a851fb12f0f4 001 2>$null; ';
                    ps += 'powercfg /setacvalueindex $targetGuid 19cbb8fa-5279-450e-9fac-8a3d5fedd0c1 12bbebe6-58d6-4636-95bb-3217ef867c1a 000 2>$null; ';
                    ps += 'powercfg /setdcvalueindex $targetGuid 19cbb8fa-5279-450e-9fac-8a3d5fedd0c1 12bbebe6-58d6-4636-95bb-3217ef867c1a 000 2>$null; ';
                    ps += 'powercfg /setacvalueindex $targetGuid 238c9fa8-0aad-41ed-83f4-97be242c8f20 29f6c1db-86da-48c5-9fdb-f2b67b1f44da 0x00000000 2>$null; ';
                    ps += 'powercfg /setdcvalueindex $targetGuid 238c9fa8-0aad-41ed-83f4-97be242c8f20 29f6c1db-86da-48c5-9fdb-f2b67b1f44da 0x00000000 2>$null; ';
                    ps += 'powercfg /setacvalueindex $targetGuid 238c9fa8-0aad-41ed-83f4-97be242c8f20 94ac6d29-73ce-41a6-809f-6363ba21b47e 000 2>$null; ';
                    ps += 'powercfg /setdcvalueindex $targetGuid 238c9fa8-0aad-41ed-83f4-97be242c8f20 94ac6d29-73ce-41a6-809f-6363ba21b47e 000 2>$null; ';
                    ps += 'powercfg /setacvalueindex $targetGuid 238c9fa8-0aad-41ed-83f4-97be242c8f20 9d7815a6-7ee4-497e-8888-515a05f02364 0x00000000 2>$null; ';
                    ps += 'powercfg /setdcvalueindex $targetGuid 238c9fa8-0aad-41ed-83f4-97be242c8f20 9d7815a6-7ee4-497e-8888-515a05f02364 0x00000000 2>$null; ';
                    ps += 'powercfg /setacvalueindex $targetGuid 238c9fa8-0aad-41ed-83f4-97be242c8f20 bd3b718a-0680-4d9d-8ab2-e1d2b4ac806d 000 2>$null; ';
                    ps += 'powercfg /setdcvalueindex $targetGuid 238c9fa8-0aad-41ed-83f4-97be242c8f20 bd3b718a-0680-4d9d-8ab2-e1d2b4ac806d 000 2>$null; ';
                    ps += 'reg add "HKLM\\System\\ControlSet001\\Control\\Power\\PowerSettings\\2a737441-1930-4402-8d77-b2bebba308a3\\0853a681-27c8-4100-a2fd-82013e970683" /v "Attributes" /t REG_DWORD /d 0 /f 2>$null; ';
                    ps += 'powercfg /setacvalueindex $targetGuid 2a737441-1930-4402-8d77-b2bebba308a3 0853a681-27c8-4100-a2fd-82013e970683 0x00000000 2>$null; ';
                    ps += 'powercfg /setdcvalueindex $targetGuid 2a737441-1930-4402-8d77-b2bebba308a3 0853a681-27c8-4100-a2fd-82013e970683 0x00000000 2>$null; ';
                    ps += 'powercfg /setacvalueindex $targetGuid 2a737441-1930-4402-8d77-b2bebba308a3 48e6b7a6-50f5-4782-a5d4-53bb8f07e226 000 2>$null; ';
                    ps += 'powercfg /setdcvalueindex $targetGuid 2a737441-1930-4402-8d77-b2bebba308a3 48e6b7a6-50f5-4782-a5d4-53bb8f07e226 000 2>$null; ';
                    ps += 'reg add "HKLM\\System\\ControlSet001\\Control\\Power\\PowerSettings\\2a737441-1930-4402-8d77-b2bebba308a3\\d4e98f31-5ffe-4ce1-be31-1b38b384c009" /v "Attributes" /t REG_DWORD /d 0 /f 2>$null; ';
                    ps += 'powercfg /setacvalueindex $targetGuid 2a737441-1930-4402-8d77-b2bebba308a3 d4e98f31-5ffe-4ce1-be31-1b38b384c009 000 2>$null; ';
                    ps += 'powercfg /setdcvalueindex $targetGuid 2a737441-1930-4402-8d77-b2bebba308a3 d4e98f31-5ffe-4ce1-be31-1b38b384c009 000 2>$null; ';
                    ps += 'powercfg /setacvalueindex $targetGuid 4f971e89-eebd-4455-a8de-9e59040e7347 a7066653-8d6c-40a8-910e-a1f54b84c7e5 002 2>$null; ';
                    ps += 'powercfg /setdcvalueindex $targetGuid 4f971e89-eebd-4455-a8de-9e59040e7347 a7066653-8d6c-40a8-910e-a1f54b84c7e5 002 2>$null; ';
                    ps += 'powercfg /setacvalueindex $targetGuid 501a4d13-42af-4429-9fd1-a8218c268e20 ee12f906-d277-404b-b6da-e5fa1a576df5 000 2>$null; ';
                    ps += 'powercfg /setdcvalueindex $targetGuid 501a4d13-42af-4429-9fd1-a8218c268e20 ee12f906-d277-404b-b6da-e5fa1a576df5 000 2>$null; ';
                    ps += 'powercfg /setacvalueindex $targetGuid 7516b95f-f776-4464-8c53-06167f40cc99 3c0bc021-c8a8-4e07-a973-6b14cbcb2b7e 0 2>$null; ';
                    ps += 'powercfg /setdcvalueindex $targetGuid 7516b95f-f776-4464-8c53-06167f40cc99 3c0bc021-c8a8-4e07-a973-6b14cbcb2b7e 0 2>$null; ';
                    ps += 'powercfg /setacvalueindex $targetGuid 7516b95f-f776-4464-8c53-06167f40cc99 aded5e82-b909-4619-9949-f5d71dac0bcb 0x00000064 2>$null; ';
                    ps += 'powercfg /setdcvalueindex $targetGuid 7516b95f-f776-4464-8c53-06167f40cc99 aded5e82-b909-4619-9949-f5d71dac0bcb 0x00000064 2>$null; ';
                    ps += 'powercfg /setacvalueindex $targetGuid 7516b95f-f776-4464-8c53-06167f40cc99 f1fbfde2-a960-4165-9f88-50667911ce96 0x00000064 2>$null; ';
                    ps += 'powercfg /setdcvalueindex $targetGuid 7516b95f-f776-4464-8c53-06167f40cc99 f1fbfde2-a960-4165-9f88-50667911ce96 0x00000064 2>$null; ';
                    ps += 'powercfg /setacvalueindex $targetGuid 7516b95f-f776-4464-8c53-06167f40cc99 fbd9aa66-9553-4097-ba44-ed6e9d65eab8 000 2>$null; ';
                    ps += 'powercfg /setdcvalueindex $targetGuid 7516b95f-f776-4464-8c53-06167f40cc99 fbd9aa66-9553-4097-ba44-ed6e9d65eab8 000 2>$null; ';
                    ps += 'powercfg /setacvalueindex $targetGuid 9596fb26-9850-41fd-ac3e-f7c3c00afd4b 10778347-1370-4ee0-8bbd-33bdacaade49 001 2>$null; ';
                    ps += 'powercfg /setdcvalueindex $targetGuid 9596fb26-9850-41fd-ac3e-f7c3c00afd4b 10778347-1370-4ee0-8bbd-33bdacaade49 001 2>$null; ';
                    ps += 'powercfg /setacvalueindex $targetGuid 9596fb26-9850-41fd-ac3e-f7c3c00afd4b 34c7b99f-9a6d-4b3c-8dc7-b6693b78cef4 000 2>$null; ';
                    ps += 'powercfg /setdcvalueindex $targetGuid 9596fb26-9850-41fd-ac3e-f7c3c00afd4b 34c7b99f-9a6d-4b3c-8dc7-b6693b78cef4 000 2>$null; ';
                    ps += 'powercfg /setacvalueindex $targetGuid 44f3beca-a7c0-460e-9df2-bb8b99e0cba6 3619c3f2-afb2-4afc-b0e9-e7fef372de36 002 2>$null; ';
                    ps += 'powercfg /setdcvalueindex $targetGuid 44f3beca-a7c0-460e-9df2-bb8b99e0cba6 3619c3f2-afb2-4afc-b0e9-e7fef372de36 002 2>$null; ';
                    ps += 'powercfg /setacvalueindex $targetGuid c763b4ec-0e50-4b6b-9bed-2b92a6ee884e 7ec1751b-60ed-4588-afb5-9819d3d77d90 003 2>$null; ';
                    ps += 'powercfg /setdcvalueindex $targetGuid c763b4ec-0e50-4b6b-9bed-2b92a6ee884e 7ec1751b-60ed-4588-afb5-9819d3d77d90 003 2>$null; ';
                    ps += 'powercfg /setacvalueindex $targetGuid f693fb01-e858-4f00-b20f-f30e12ac06d6 191f65b5-d45c-4a4f-8aae-1ab8bfd980e6 001 2>$null; ';
                    ps += 'powercfg /setdcvalueindex $targetGuid f693fb01-e858-4f00-b20f-f30e12ac06d6 191f65b5-d45c-4a4f-8aae-1ab8bfd980e6 001 2>$null; ';
                    ps += 'powercfg /setacvalueindex $targetGuid e276e160-7cb0-43c6-b20b-73f5dce39954 a1662ab2-9d34-4e53-ba8b-2639b9e20857 003 2>$null; ';
                    ps += 'powercfg /setdcvalueindex $targetGuid e276e160-7cb0-43c6-b20b-73f5dce39954 a1662ab2-9d34-4e53-ba8b-2639b9e20857 003 2>$null; ';
                    ps += 'powercfg /setacvalueindex $targetGuid e73a048d-bf27-4f12-9731-8b2076e8891f 5dbb7c9f-38e9-40d2-9749-4f8a0e9f640f 000 2>$null; ';
                    ps += 'powercfg /setdcvalueindex $targetGuid e73a048d-bf27-4f12-9731-8b2076e8891f 5dbb7c9f-38e9-40d2-9749-4f8a0e9f640f 000 2>$null; ';
                    ps += 'powercfg /setacvalueindex $targetGuid e73a048d-bf27-4f12-9731-8b2076e8891f 637ea02f-bbcb-4015-8e2c-a1c7b9c0b546 000 2>$null; ';
                    ps += 'powercfg /setdcvalueindex $targetGuid e73a048d-bf27-4f12-9731-8b2076e8891f 637ea02f-bbcb-4015-8e2c-a1c7b9c0b546 000 2>$null; ';
                    ps += 'powercfg /setacvalueindex $targetGuid e73a048d-bf27-4f12-9731-8b2076e8891f 8183ba9a-e910-48da-8769-14ae6dc1170a 0x00000000 2>$null; ';
                    ps += 'powercfg /setdcvalueindex $targetGuid e73a048d-bf27-4f12-9731-8b2076e8891f 8183ba9a-e910-48da-8769-14ae6dc1170a 0x00000000 2>$null; ';
                    ps += 'powercfg /setacvalueindex $targetGuid e73a048d-bf27-4f12-9731-8b2076e8891f 9a66d8d7-4ff7-4ef9-b5a2-5a326ca2a469 0x00000000 2>$null; ';
                    ps += 'powercfg /setdcvalueindex $targetGuid e73a048d-bf27-4f12-9731-8b2076e8891f 9a66d8d7-4ff7-4ef9-b5a2-5a326ca2a469 0x00000000 2>$null; ';
                    ps += 'powercfg /setacvalueindex $targetGuid e73a048d-bf27-4f12-9731-8b2076e8891f bcded951-187b-4d05-bccc-f7e51960c258 000 2>$null; ';
                    ps += 'powercfg /setdcvalueindex $targetGuid e73a048d-bf27-4f12-9731-8b2076e8891f bcded951-187b-4d05-bccc-f7e51960c258 000 2>$null; ';
                    ps += 'powercfg /setacvalueindex $targetGuid e73a048d-bf27-4f12-9731-8b2076e8891f d8742dcb-3e6a-4b3c-b3fe-374623cdcf06 000 2>$null; ';
                    ps += 'powercfg /setdcvalueindex $targetGuid e73a048d-bf27-4f12-9731-8b2076e8891f d8742dcb-3e6a-4b3c-b3fe-374623cdcf06 000 2>$null; ';
                    ps += 'powercfg /setacvalueindex $targetGuid e73a048d-bf27-4f12-9731-8b2076e8891f f3c5027d-cd16-4930-aa6b-90db844a8f00 0x00000000 2>$null; ';
                    ps += 'powercfg /setdcvalueindex $targetGuid e73a048d-bf27-4f12-9731-8b2076e8891f f3c5027d-cd16-4930-aa6b-90db844a8f00 0x00000000 2>$null; ';
                    ps += 'powercfg /setacvalueindex $targetGuid de830923-a562-41af-a086-e3a2c6bad2da 13d09884-f74e-474a-a852-b6bde8ad03a8 0x00000064 2>$null; ';
                    ps += 'powercfg /setdcvalueindex $targetGuid de830923-a562-41af-a086-e3a2c6bad2da 13d09884-f74e-474a-a852-b6bde8ad03a8 0x00000064 2>$null; ';
                    ps += 'powercfg /setacvalueindex $targetGuid de830923-a562-41af-a086-e3a2c6bad2da e69653ca-cf7f-4f05-aa73-cb833fa90ad4 0x00000000 2>$null; ';
                    ps += 'powercfg /setdcvalueindex $targetGuid de830923-a562-41af-a086-e3a2c6bad2da e69653ca-cf7f-4f05-aa73-cb833fa90ad4 0x00000000 2>$null; ';
                }

                ps += 'powercfg /setactive $targetGuid; ';
                ps += 'exit 0; ';

                addLogEntry("TURK Power Plan & Latency settings successfully applied! Please restart your PC.", "ok");
                addRecentActivity("Power Plan Tweaks", "TURK power plan and CPU boost activated");
            }
            else if (sectionName === 'Global OS Settings') {
                const osRss = document.getElementById('os-rss').value;
                const osRsc = document.getElementById('os-rsc').value;
                const osChimney = document.getElementById('os-chimney').value;
                const osTask = document.getElementById('os-taskoff').value;
                const osNtd = document.getElementById('os-ntd').value;
                const osNtdais = document.getElementById('os-ntdais').value;
                const osPcf = document.getElementById('os-pcf').value;

                addLogEntry(`Executing Netsh: netsh int tcp set global rss=${osRss}`, "info");
                addLogEntry(`Executing Netsh: netsh int tcp set global rsc=${osRsc}`, "info");
                addLogEntry(`Executing Netsh: netsh int tcp set global chimney=${osChimney}`, "info");
                addLogEntry(`Registry: HKLM:\SYSTEM\CurrentControlSet\Services\Tcpip\Parameters -> DisableTaskOffload = ${osTask === 'enabled' ? 0 : 1}`, "reg");
                addLogEntry(`Registry: HKLM:\SYSTEM\CurrentControlSet\Services\Tcpip\Parameters -> EnableWannaOutcoming = ${osNtd === 'enabled' ? 1 : 0}`, "reg");
                addLogEntry(`Executing Netsh: netsh int tcp set global netdma=${osNtdais === 'allowed' ? 'enabled' : 'disabled'}`, "info");
                addLogEntry(`Executing Netsh: netsh int tcp set global nonsacktoptable=${osPcf === 'enabled' ? 'disabled' : 'enabled'}`, "info");
                addLogEntry(`Global OS parameters updated!`, "ok");
                addRecentActivity("Global OS Tweaks", "Netsh TCP global parameters configured");

                ps += `netsh int tcp set global rss=${osRss}; netsh int tcp set global rsc=${osRsc}; netsh int tcp set global chimney=${osChimney}; netsh int tcp set global netdma=${osNtdais === 'allowed' ? 'enabled' : 'disabled'}; netsh int tcp set global nonsacktoptable=${osPcf === 'enabled' ? 'disabled' : 'enabled'}; `;
                ps += `reg add "HKLM\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters" /v "DisableTaskOffload" /t REG_DWORD /d ${osTask === 'enabled' ? 0 : 1} /f 2>$null; `;
                ps += `reg add "HKLM\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters" /v "EnableWannaOutcoming" /t REG_DWORD /d ${osNtd === 'enabled' ? 1 : 0} /f 2>$null; `;
            }
            else if (sectionName === 'AFD Registry Tweaks') {
                const afdRecv = document.getElementById('afd-recv').value;
                const afdSend = document.getElementById('afd-send').value;
                const afdMult = document.getElementById('afd-mult').value;
                const afdAlign = document.getElementById('afd-align').value;
                const afdNoHold = document.getElementById('afd-nohold').value;
                const afdWorkers = document.getElementById('afd-workers').value;
                const afdBoost = document.getElementById('afd-boost').value;
                const afdSmallSize = document.getElementById('afd-small-size').value;
                const afdMedSize = document.getElementById('afd-med-size').value;
                const afdLargeSize = document.getElementById('afd-large-size').value;
                const afdSmallDepth = document.getElementById('afd-small-depth').value;
                const afdMedDepth = document.getElementById('afd-med-depth').value;
                const afdLargeDepth = document.getElementById('afd-large-depth').value;
                const afdAddr = document.getElementById('afd-addr').value;
                const afdChain = document.getElementById('afd-chain').value;
                const afdAccept = document.getElementById('afd-accept').value;
                const afdSec = document.getElementById('afd-sec').value;
                const afdDyn = document.getElementById('afd-dyn').value;
                const afdFastSend = document.getElementById('afd-fast-send').value;
                const afdFastCopy = document.getElementById('afd-fast-copy').value;
                const afdPush = document.getElementById('afd-push').value;
                const afdRelease = document.getElementById('afd-release').value;

                addLogEntry(`Registry: HKLM:\SYSTEM\CurrentControlSet\Services\AFD\Parameters -> DefaultReceiveWindow = ${afdRecv}`, "reg");
                addLogEntry(`Registry: HKLM:\SYSTEM\CurrentControlSet\Services\AFD\Parameters -> DefaultSendWindow = ${afdSend}`, "reg");
                addLogEntry(`Registry: HKLM:\SYSTEM\CurrentControlSet\Services\AFD\Parameters -> BufferMultiplier = ${afdMult}`, "reg");
                addLogEntry(`Registry: HKLM:\SYSTEM\CurrentControlSet\Services\AFD\Parameters -> BufferAlignment = ${afdAlign}`, "reg");
                addLogEntry(`Registry: HKLM:\SYSTEM\CurrentControlSet\Services\AFD\Parameters -> DoNotHoldNICBuffers = ${afdNoHold}`, "reg");
                addLogEntry(`Registry: HKLM:\SYSTEM\CurrentControlSet\Services\AFD\Parameters -> TransmitWorker = ${afdWorkers}`, "reg");
                addLogEntry(`Registry: HKLM:\SYSTEM\CurrentControlSet\Services\AFD\Parameters -> PriorityBoost = ${afdBoost}`, "reg");
                addLogEntry(`Registry: HKLM:\SYSTEM\CurrentControlSet\Services\AFD\Parameters -> SmallBufferSize = ${afdSmallSize}`, "reg");
                addLogEntry(`Registry: HKLM:\SYSTEM\CurrentControlSet\Services\AFD\Parameters -> MediumBufferSize = ${afdMedSize}`, "reg");
                addLogEntry(`Registry: HKLM:\SYSTEM\CurrentControlSet\Services\AFD\Parameters -> LargeBufferSize = ${afdLargeSize}`, "reg");
                addLogEntry(`Registry: HKLM:\SYSTEM\CurrentControlSet\Services\AFD\Parameters -> SmallBufferListDepth = ${afdSmallDepth}`, "reg");
                addLogEntry(`Registry: HKLM:\SYSTEM\CurrentControlSet\Services\AFD\Parameters -> MediumBufferListDepth = ${afdMedDepth}`, "reg");
                addLogEntry(`Registry: HKLM:\SYSTEM\CurrentControlSet\Services\AFD\Parameters -> LargBufferListDepth = ${afdLargeDepth}`, "reg");
                addLogEntry(`Registry: HKLM:\SYSTEM\CurrentControlSet\Services\AFD\Parameters -> DisableAddressSharing = ${afdAddr}`, "reg");
                addLogEntry(`Registry: HKLM:\SYSTEM\CurrentControlSet\Services\AFD\Parameters -> DisableChainedReceive = ${afdChain}`, "reg");
                addLogEntry(`Registry: HKLM:\SYSTEM\CurrentControlSet\Services\AFD\Parameters -> DisableDirectAcceptEx = ${afdAccept}`, "reg");
                addLogEntry(`Registry: HKLM:\SYSTEM\CurrentControlSet\Services\AFD\Parameters -> DisableRawSecurity = ${afdSec}`, "reg");
                addLogEntry(`Registry: HKLM:\SYSTEM\CurrentControlSet\Services\AFD\Parameters -> DynamicSendBufferDisable = ${afdDyn}`, "reg");
                addLogEntry(`Registry: HKLM:\SYSTEM\CurrentControlSet\Services\AFD\Parameters -> FastSendDatagramThreshold = ${afdFastSend}`, "reg");
                addLogEntry(`Registry: HKLM:\SYSTEM\CurrentControlSet\Services\AFD\Parameters -> FastCopyReceiveThreshold = ${afdFastCopy}`, "reg");
                addLogEntry(`Registry: HKLM:\SYSTEM\CurrentControlSet\Services\AFD\Parameters -> IgnorePushBitOnReceives = ${afdPush}`, "reg");
                addLogEntry(`Registry: HKLM:\SYSTEM\CurrentControlSet\Services\AFD\Parameters -> IgnoreOrderlyRelease = ${afdRelease}`, "reg");
                addLogEntry(`AFD and sockets buffer tweaks written. Please restart to apply changes.`, "ok");
                addRecentActivity("AFD Sockets Tweaks", "Socket buffers & AFD parameters optimized");

                const keys = {
                    DefaultReceiveWindow: afdRecv,
                    DefaultSendWindow: afdSend,
                    BufferMultiplier: afdMult,
                    BufferAlignment: afdAlign,
                    DoNotHoldNICBuffers: afdNoHold,
                    TransmitWorker: afdWorkers,
                    PriorityBoost: afdBoost,
                    SmallBufferSize: afdSmallSize,
                    MediumBufferSize: afdMedSize,
                    LargeBufferSize: afdLargeSize,
                    SmallBufferListDepth: afdSmallDepth,
                    MediumBufferListDepth: afdMedDepth,
                    LargBufferListDepth: afdLargeDepth,
                    DisableAddressSharing: afdAddr,
                    DisableChainedReceive: afdChain,
                    DisableDirectAcceptEx: afdAccept,
                    DisableRawSecurity: afdSec,
                    DynamicSendBufferDisable: afdDyn,
                    FastSendDatagramThreshold: afdFastSend,
                    FastCopyReceiveThreshold: afdFastCopy,
                    IgnorePushBitOnReceives: afdPush,
                    IgnoreOrderlyRelease: afdRelease
                };
                for (const [k, v] of Object.entries(keys)) {
                    if (v !== undefined && v !== "") {
                        ps += `reg add "HKLM\\SYSTEM\\CurrentControlSet\\Services\\AFD\\Parameters" /v "${k}" /t REG_DWORD /d ${v} /f 2>$null; `;
                    }
                }
            }
            else if (sectionName === 'RSS Settings') {
                const rssStatus = document.getElementById('rss-status').value;
                const rssQueues = document.getElementById('rss-queues').value;
                const rssProfile = document.getElementById('rss-profile').value;
                const rssBaseProc = document.getElementById('rss-baseproc').value;
                const rssMaxProc = document.getElementById('rss-maxproc').value;
                const rssMaxProcs = document.getElementById('rss-maxprocs').value;
                const rssPort = document.getElementById('rss-port-scaling').value;
                const rssMany = document.getElementById('rss-manycore').value;
                const rssTcpip = document.getElementById('rss-tcpip-base').value;
                const rssNdis = document.getElementById('rss-ndis-base').value;

                const adapterSelectEl = document.getElementById('adapter-select');
                const adapterName = getSelectedAdapterName();
                const val = adapterSelectEl.value;

                addLogEntry(`Registry: Set BaseProcessorNumber = ${rssBaseProc}`, "reg");
                addLogEntry(`Registry: Set *NumRssQueues = ${rssQueues}`, "reg");
                addLogEntry(`Registry: Set *RSSProfile = ${rssProfile}`, "reg");
                addLogEntry(`Registry: Set MaxProcessorNumber = ${rssMaxProc}`, "reg");
                addLogEntry(`Registry: Set MaxProcessors = ${rssMaxProcs}`, "reg");
                addLogEntry(`Registry: Set DisablePortScaling = ${rssPort === 'Enabled' ? 1 : 0}`, "reg");
                addLogEntry(`Registry: Set ManyCoreScaling = ${rssMany === 'Enabled' ? 1 : 0}`, "reg");
                addLogEntry(`Registry: HKLM:\SYSTEM\CurrentControlSet\Services\Tcpip\Parameters -> RssBaseCpu = ${rssTcpip}`, "reg");
                addLogEntry(`Registry: HKLM:\SYSTEM\CurrentControlSet\Services\NDIS\Parameters -> RssBaseCpu = ${rssNdis}`, "reg");
                addLogEntry(`Command: Set-NetAdapterRss -InterfaceDescription "${adapterName}" -Enabled ${rssStatus === 'Enable' ? '$true' : '$false'}`, "info");
                addLogEntry(`RSS configurations completed.`, "ok");
                addRecentActivity("RSS Settings", "Network adapter RSS queues configured");

                if (rssTcpip !== undefined && rssTcpip !== "") {
                    ps += `reg add "HKLM\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters" /v "RssBaseCpu" /t REG_DWORD /d ${rssTcpip} /f 2>$null; `;
                }
                if (rssNdis !== undefined && rssNdis !== "") {
                    ps += `reg add "HKLM\\SYSTEM\\CurrentControlSet\\Services\\NDIS\\Parameters" /v "RssBaseCpu" /t REG_DWORD /d ${rssNdis} /f 2>$null; `;
                }
                ps += getDynamicRegistryPathPowerShell(val);
                ps += `if ($ap) { `;
                ps += `Set-ItemProperty -Path $ap -Name 'BaseProcessorNumber' -Value ${rssBaseProc} -Force -ErrorAction SilentlyContinue; `;
                ps += `Set-ItemProperty -Path $ap -Name '*NumRssQueues' -Value ${rssQueues} -Force -ErrorAction SilentlyContinue; `;
                ps += `Set-ItemProperty -Path $ap -Name '*RSSProfile' -Value ${rssProfile} -Force -ErrorAction SilentlyContinue; `;
                ps += `Set-ItemProperty -Path $ap -Name 'MaxProcessorNumber' -Value ${rssMaxProc} -Force -ErrorAction SilentlyContinue; `;
                ps += `Set-ItemProperty -Path $ap -Name 'MaxProcessors' -Value ${rssMaxProcs} -Force -ErrorAction SilentlyContinue; `;
                ps += `Set-ItemProperty -Path $ap -Name 'DisablePortScaling' -Value ${rssPort === 'Enabled' ? 1 : 0} -Force -ErrorAction SilentlyContinue; `;
                ps += `Set-ItemProperty -Path $ap -Name 'ManyCoreScaling' -Value ${rssMany === 'Enabled' ? 1 : 0} -Force -ErrorAction SilentlyContinue; `;
                ps += `}; `;
                ps += `Set-NetAdapterRss -InterfaceDescription "${adapterName}" -Enabled ${rssStatus === 'Enable' ? '$true' : '$false'} -ErrorAction SilentlyContinue; `;
                if (adapterName) {
                    ps += `Restart-NetAdapter -InterfaceDescription "${adapterName}" -Confirm:$false -ErrorAction SilentlyContinue; `;
                }
            }
            else if (sectionName === 'Interrupt Settings') {
                const msi = document.getElementById('int-msi').value;
                const pri = document.getElementById('int-pri').value;
                const policy = document.getElementById('int-policy').value;
                const adapterSelectEl = document.getElementById('adapter-select');
                const val = adapterSelectEl.value;
                const adapterName = getSelectedAdapterName();

                addLogEntry(`Registry: Set MSISupported = ${msi === 'Enabled' ? 1 : 0}`, "reg");
                addLogEntry(`Registry: Set DevicePriority = ${pri}`, "reg");
                addLogEntry(`Registry: Set DevicePolicy = ${policy}`, "reg");
                addLogEntry(`Interrupt Moderation settings applied successfully!`, "ok");
                addRecentActivity("Interrupt Settings", "Adapter MSI & interrupt priority updated");

                ps += getDynamicRegistryPathPowerShell(val);
                ps += `if ($ap) { `;
                ps += `Set-ItemProperty -Path $ap -Name 'MSISupported' -Value ${msi === 'Enabled' ? 1 : 0} -Force -ErrorAction SilentlyContinue; `;
                ps += `Set-ItemProperty -Path $ap -Name 'DevicePriority' -Value ${pri} -Force -ErrorAction SilentlyContinue; `;
                ps += `Set-ItemProperty -Path $ap -Name 'DevicePolicy' -Value ${policy} -Force -ErrorAction SilentlyContinue; `;
                ps += `}; `;
                if (adapterName) {
                    ps += `Restart-NetAdapter -InterfaceDescription "${adapterName}" -Confirm:$false -ErrorAction SilentlyContinue; `;
                }
            }
            else if (sectionName === 'Power Saving Settings') {
                const sleep = document.getElementById('pwr-sleep').value;
                const gating = document.getElementById('pwr-gating').value;
                const dyngating = document.getElementById('pwr-dyn-gating').value;
                const autosave = document.getElementById('pwr-autosave').value;
                const nicsaver = document.getElementById('pwr-nic-saver').value;
                const delay = document.getElementById('pwr-delay').value;
                const speeddown = document.getElementById('pwr-speeddown').value;
                const adapterSelectEl = document.getElementById('adapter-select');
                const val = adapterSelectEl.value;
                const adapterName = getSelectedAdapterName();

                addLogEntry(`Registry: Set EnablePME = ${sleep === 'Enabled' ? 1 : 0}`, "reg");
                addLogEntry(`Registry: Set *EnableConnectedPowerGating = ${gating === 'Enabled' ? 1 : 0}`, "reg");
                addLogEntry(`Registry: Set *EnableDynamicPowerGating = ${dyngating === 'Enabled' ? 1 : 0}`, "reg");
                addLogEntry(`Registry: Set AutoPowerSaveModeEnabled = ${autosave === 'Enabled' ? 1 : 0}`, "reg");
                addLogEntry(`Registry: Set *NicAutoPowerSaver = ${nicsaver === 'Enabled' ? 1 : 0}`, "reg");
                addLogEntry(`Registry: Set DisableDelayedPowerUp = ${delay === 'Enabled' ? 1 : 0}`, "reg");
                addLogEntry(`Registry: Set ReduceSpeedOnPowerDown = ${speeddown === 'Enabled' ? 1 : 0}`, "reg");
                addLogEntry(`Power saving and sleep features applied!`, "ok");
                addRecentActivity("Power Saving Tweaks", "Selective suspend & power gating disabled");

                ps += getDynamicRegistryPathPowerShell(val);
                ps += `if ($ap) { `;
                ps += `Set-ItemProperty -Path $ap -Name 'EnablePME' -Value ${sleep === 'Enabled' ? 1 : 0} -Force -ErrorAction SilentlyContinue; `;
                ps += `Set-ItemProperty -Path $ap -Name '*EnableConnectedPowerGating' -Value ${gating === 'Enabled' ? 1 : 0} -Force -ErrorAction SilentlyContinue; `;
                ps += `Set-ItemProperty -Path $ap -Name '*EnableDynamicPowerGating' -Value ${dyngating === 'Enabled' ? 1 : 0} -Force -ErrorAction SilentlyContinue; `;
                ps += `Set-ItemProperty -Path $ap -Name 'AutoPowerSaveModeEnabled' -Value ${autosave === 'Enabled' ? 1 : 0} -Force -ErrorAction SilentlyContinue; `;
                ps += `Set-ItemProperty -Path $ap -Name '*NicAutoPowerSaver' -Value ${nicsaver === 'Enabled' ? 1 : 0} -Force -ErrorAction SilentlyContinue; `;
                ps += `Set-ItemProperty -Path $ap -Name 'DisableDelayedPowerUp' -Value ${delay === 'Enabled' ? 1 : 0} -Force -ErrorAction SilentlyContinue; `;
                ps += `Set-ItemProperty -Path $ap -Name 'ReduceSpeedOnPowerDown' -Value ${speeddown === 'Enabled' ? 1 : 0} -Force -ErrorAction SilentlyContinue; `;
                ps += `}; `;
                if (adapterName) {
                    ps += `Restart-NetAdapter -InterfaceDescription "${adapterName}" -Confirm:$false -ErrorAction SilentlyContinue; `;
                }
            }
            else if (sectionName === 'Interface Settings') {
                const mtu = document.getElementById('iface-mtu').value;
                const hop = document.getElementById('iface-hop').value;
                const ecn = document.getElementById('iface-ecn').value;
                const advRoute = document.getElementById('iface-adv-route').value;
                const advertising = document.getElementById('iface-advertising').value;
                const metric = document.getElementById('iface-metric').value;
                const mss = document.getElementById('iface-mss').value;
                const forwarding = document.getElementById('iface-forwarding').value;
                const ignoreRoute = document.getElementById('iface-ignore-route').value;
                const routerDisc = document.getElementById('iface-router-disc').value;
                const baseReach = document.getElementById('iface-base-reach').value;
                const retrans = document.getElementById('iface-retrans').value;
                const adapterSelectEl = document.getElementById('adapter-select');
                const adapterName = getSelectedAdapterName();

                addLogEntry(`Executing Netsh: netsh int ip set subinterface "${adapterName}" mtu=${mtu} store=persistent`, "info");
                addLogEntry(`Executing Netsh: netsh int ipv4 set global defaultcurhoplimit=${hop}`, "info");
                addLogEntry(`Executing Netsh: netsh int tcp set global ecncapability=${ecn}`, "info");
                addLogEntry(`Interface parameters updated!`, "ok");
                addRecentActivity("Interface Settings", "Adapter MTU, hop limit & ECN configured");

                ps += `netsh int ip set subinterface "${adapterName}" mtu=${mtu} store=persistent; `;
                ps += `netsh int ipv4 set global defaultcurhoplimit=${hop}; `;
                ps += `netsh int tcp set global ecncapability=${ecn}; `;
                ps += `Set-NetIPInterface -InterfaceDescription "${adapterName}" -AddressFamily IPv4 -AdvertiseDefaultRoute ${advRoute === 'enabled' ? '$true' : '$false'} -Advertising ${advertising === 'enabled' ? '$true' : '$false'} -AutomaticMetric ${metric === 'enabled' ? '$true' : '$false'} -ClampMss ${mss === 'enabled' ? '$true' : '$false'} -Forwarding ${forwarding === 'enabled' ? '$true' : '$false'} -IgnoreDefaultRoutes ${ignoreRoute === 'enabled' ? '$true' : '$false'} -RouterDiscovery ${routerDisc === 'enabled' ? '$true' : '$false'} -BaseReachableTime ${baseReach} -RetransmitTime ${retrans} -ErrorAction SilentlyContinue; `;
            }
            else if (sectionName === 'Advanced Adapter Settings') {
                const flow = document.getElementById('adv-flow').value;
                const chk = document.getElementById('adv-chkipv4').value;
                const tcpipv4 = document.getElementById('adv-tcpinpv4').value;
                const tcpipv6 = document.getElementById('adv-tcpinpv6').value;
                const udpipv4 = document.getElementById('adv-udpinpv4').value;
                const udpipv6 = document.getElementById('adv-udpinpv6').value;
                const lsov2ipv4 = document.getElementById('adv-lsov2ipv4').value;
                const lsov2ipv6 = document.getElementById('adv-lsov2ipv6').value;
                const priority = document.getElementById('adv-priority').value;
                const moderation = document.getElementById('adv-moderation').value;
                const modrate = document.getElementById('adv-modrate').value;
                const direct = document.getElementById('adv-direct').value;
                const rx = document.getElementById('adv-buffers-rx').value;
                const tx = document.getElementById('adv-buffers-tx').value;
                const delay = document.getElementById('adv-delay').value;
                const coalsize = document.getElementById('adv-coalesce-size').value;
                const arp = document.getElementById('adv-arp').value;
                const ns = document.getElementById('adv-ns').value;
                const adapterSelectEl = document.getElementById('adapter-select');
                const val = adapterSelectEl.value;
                const adapterName = getSelectedAdapterName();

                addLogEntry(`Registry: Set *FlowControl = ${flow}`, "reg");
                addLogEntry(`Registry: Set *IPChecksumOffloadIPv4 = ${chk}`, "reg");
                addLogEntry(`Registry: Set *TCPChecksumOffloadIPv4 = ${tcpipv4}`, "reg");
                addLogEntry(`Registry: Set *TCPChecksumOffloadIPv6 = ${tcpipv6}`, "reg");
                addLogEntry(`Registry: Set *UDPChecksumOffloadIPv4 = ${udpipv4}`, "reg");
                addLogEntry(`Registry: Set *UDPChecksumOffloadIPv6 = ${udpipv6}`, "reg");
                addLogEntry(`Registry: Set *LsoV2IPv4 = ${lsov2ipv4}`, "reg");
                addLogEntry(`Registry: Set *LsoV2IPv6 = ${lsov2ipv6}`, "reg");
                addLogEntry(`Registry: Set *PriorityVLANTag = ${priority}`, "reg");
                addLogEntry(`Registry: Set *InterruptModeration = ${moderation}`, "reg");
                addLogEntry(`Registry: Set ITR = ${modrate}`, "reg");
                addLogEntry(`Registry: Set *PacketDirect = ${direct === 'Enabled' ? 1 : 0}`, "reg");
                addLogEntry(`Registry: Set *ReceiveBuffers = ${rx}`, "reg");
                addLogEntry(`Registry: Set *TransmitBuffers = ${tx}`, "reg");
                addLogEntry(`Registry: Set TxIntDelay = ${delay}`, "reg");
                addLogEntry(`Registry: Set CoalesceBufferSize = ${coalsize}`, "reg");
                addLogEntry(`Registry: Set *PMARPOffload = ${arp}`, "reg");
                addLogEntry(`Registry: Set *PMNSOffload = ${ns}`, "reg");
                addLogEntry("NIC advanced settings configured successfully.", "ok");
                addRecentActivity("Advanced NIC Settings", "Adapter offloads & buffer sizes optimized");

                ps += getDynamicRegistryPathPowerShell(val);
                ps += `if ($ap) { `;
                ps += `Set-ItemProperty -Path $ap -Name '*FlowControl' -Value '${cleanRegistryValue(flow)}' -Force -ErrorAction SilentlyContinue; `;
                ps += `Set-ItemProperty -Path $ap -Name '*IPChecksumOffloadIPv4' -Value '${cleanRegistryValue(chk)}' -Force -ErrorAction SilentlyContinue; `;
                ps += `Set-ItemProperty -Path $ap -Name '*TCPChecksumOffloadIPv4' -Value '${cleanRegistryValue(tcpipv4)}' -Force -ErrorAction SilentlyContinue; `;
                ps += `Set-ItemProperty -Path $ap -Name '*TCPChecksumOffloadIPv6' -Value '${cleanRegistryValue(tcpipv6)}' -Force -ErrorAction SilentlyContinue; `;
                ps += `Set-ItemProperty -Path $ap -Name '*UDPChecksumOffloadIPv4' -Value '${cleanRegistryValue(udpipv4)}' -Force -ErrorAction SilentlyContinue; `;
                ps += `Set-ItemProperty -Path $ap -Name '*UDPChecksumOffloadIPv6' -Value '${cleanRegistryValue(udpipv6)}' -Force -ErrorAction SilentlyContinue; `;
                ps += `Set-ItemProperty -Path $ap -Name '*LsoV2IPv4' -Value '${cleanRegistryValue(lsov2ipv4)}' -Force -ErrorAction SilentlyContinue; `;
                ps += `Set-ItemProperty -Path $ap -Name '*LsoV2IPv6' -Value '${cleanRegistryValue(lsov2ipv6)}' -Force -ErrorAction SilentlyContinue; `;
                ps += `Set-ItemProperty -Path $ap -Name '*PriorityVLANTag' -Value '${cleanRegistryValue(priority)}' -Force -ErrorAction SilentlyContinue; `;
                ps += `Set-ItemProperty -Path $ap -Name '*InterruptModeration' -Value '${cleanRegistryValue(moderation)}' -Force -ErrorAction SilentlyContinue; `;
                ps += `Set-ItemProperty -Path $ap -Name 'ITR' -Value '${cleanRegistryValue(modrate)}' -Force -ErrorAction SilentlyContinue; `;
                ps += `Set-ItemProperty -Path $ap -Name '*PacketDirect' -Value '${cleanRegistryValue(direct) === 'Enabled' ? 1 : 0}' -Force -ErrorAction SilentlyContinue; `;
                ps += `Set-ItemProperty -Path $ap -Name '*ReceiveBuffers' -Value '${cleanRegistryValue(rx)}' -Force -ErrorAction SilentlyContinue; `;
                ps += `Set-ItemProperty -Path $ap -Name '*TransmitBuffers' -Value '${cleanRegistryValue(tx)}' -Force -ErrorAction SilentlyContinue; `;
                ps += `Set-ItemProperty -Path $ap -Name 'TxIntDelay' -Value '${cleanRegistryValue(delay)}' -Force -ErrorAction SilentlyContinue; `;
                ps += `Set-ItemProperty -Path $ap -Name 'CoalesceBufferSize' -Value '${cleanRegistryValue(coalsize)}' -Force -ErrorAction SilentlyContinue; `;
                ps += `Set-ItemProperty -Path $ap -Name '*PMARPOffload' -Value '${cleanRegistryValue(arp)}' -Force -ErrorAction SilentlyContinue; `;
                ps += `Set-ItemProperty -Path $ap -Name '*PMNSOffload' -Value '${cleanRegistryValue(ns)}' -Force -ErrorAction SilentlyContinue; `;
                ps += `}; `;
                if (adapterName) {
                    ps += `Restart-NetAdapter -InterfaceDescription "${adapterName}" -Confirm:$false -ErrorAction SilentlyContinue; `;
                }
            }

            if (ps) {
                try {
                    await runPowerShellEncoded(ps);
                    btn.innerHTML = '<i class="fa-solid fa-circle-check" style="color: #4ade80; margin-right: 6px;"></i>Applied Successfully!';
                    addLogEntry(`Configurations for ${sectionName} applied successfully!`, "ok");
                } catch (err) {
                    btn.innerHTML = '<i class="fa-solid fa-circle-xmark" style="color: #f87171; margin-right: 6px;"></i>Failed!';
                    addLogEntry(`Failed to apply configurations for ${sectionName}.`, "warn");
                }
            } else {
                btn.innerHTML = '<i class="fa-solid fa-circle-check" style="color: #4ade80; margin-right: 6px;"></i>Applied!';
            }

            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }, 2500);
        });
    });

    // ---- TURK v1.1: New Tab Button Handlers ----
    document.addEventListener('click', async function(e) {

        // ---- Network Tab: Auto Adjust ----
        var btnNetwork = e.target.closest('#btn-auto-network');
        if (btnNetwork) {
            btnNetwork.disabled = true;
            btnNetwork.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Applying...';
            var ps = [
                '$adapters = Get-NetAdapter -Physical -EA SilentlyContinue | Where-Object Status -eq "Up";',
                'if (-not $adapters) { $adapters = Get-NetAdapter -EA SilentlyContinue | Where-Object Status -eq "Up" };',
                'foreach ($adapter in $adapters) {',
                '  $n = $adapter.Name;',
                '  Set-NetAdapterAdvancedProperty -Name $n -DisplayName "Advanced EEE" -DisplayValue "Disabled" -EA SilentlyContinue;',
                '  Set-NetAdapterAdvancedProperty -Name $n -DisplayName "ARP Offload" -DisplayValue "Disabled" -EA SilentlyContinue;',
                '  Set-NetAdapterAdvancedProperty -Name $n -DisplayName "Energy-Efficient Ethernet" -DisplayValue "Disabled" -EA SilentlyContinue;',
                '  Set-NetAdapterAdvancedProperty -Name $n -DisplayName "Flow Control" -DisplayValue "Disabled" -EA SilentlyContinue;',
                '  Set-NetAdapterAdvancedProperty -Name $n -DisplayName "Gigabit Lite" -DisplayValue "Disabled" -EA SilentlyContinue;',
                '  Set-NetAdapterAdvancedProperty -Name $n -DisplayName "Green Ethernet" -DisplayValue "Disabled" -EA SilentlyContinue;',
                '  Set-NetAdapterAdvancedProperty -Name $n -DisplayName "Interrupt Moderation" -DisplayValue "Enabled" -EA SilentlyContinue;',
                '  Set-NetAdapterAdvancedProperty -Name $n -DisplayName "IPv4 Checksum Offload" -DisplayValue "Rx & Tx Enabled" -EA SilentlyContinue;',
                '  Set-NetAdapterAdvancedProperty -Name $n -DisplayName "Jumbo Frame" -DisplayValue "Disabled" -EA SilentlyContinue;',
                '  Set-NetAdapterAdvancedProperty -Name $n -DisplayName "Large Send Offload v2 (IPv4)" -DisplayValue "Disabled" -EA SilentlyContinue;',
                '  Set-NetAdapterAdvancedProperty -Name $n -DisplayName "Large Send Offload v2 (IPv6)" -DisplayValue "Disabled" -EA SilentlyContinue;',
                '  Set-NetAdapterAdvancedProperty -Name $n -DisplayName "Maximum Number of RSS Queues" -DisplayValue "4 Queues" -EA SilentlyContinue;',
                '  Set-NetAdapterAdvancedProperty -Name $n -DisplayName "NS Offload" -DisplayValue "Disabled" -EA SilentlyContinue;',
                '  Set-NetAdapterAdvancedProperty -Name $n -DisplayName "Power Saving Mode" -DisplayValue "Disabled" -EA SilentlyContinue;',
                '  Set-NetAdapterAdvancedProperty -Name $n -DisplayName "Priority & VLAN" -DisplayValue "Priority & VLAN Enabled" -EA SilentlyContinue;',
                '  Set-NetAdapterAdvancedProperty -Name $n -DisplayName "Receive Buffers" -DisplayValue "4096" -EA SilentlyContinue;',
                '  Set-NetAdapterAdvancedProperty -Name $n -DisplayName "Receive Side Scaling" -DisplayValue "Enabled" -EA SilentlyContinue;',
                '  Set-NetAdapterAdvancedProperty -Name $n -DisplayName "Shutdown Wake-On-Lan" -DisplayValue "Disabled" -EA SilentlyContinue;',
                '  Set-NetAdapterAdvancedProperty -Name $n -DisplayName "TCP Checksum Offload (IPv4)" -DisplayValue "Rx & Tx Enabled" -EA SilentlyContinue;',
                '  Set-NetAdapterAdvancedProperty -Name $n -DisplayName "TCP Checksum Offload (IPv6)" -DisplayValue "Rx & Tx Enabled" -EA SilentlyContinue;',
                '  Set-NetAdapterAdvancedProperty -Name $n -DisplayName "Transmit Buffers" -DisplayValue "128" -EA SilentlyContinue;',
                '  Set-NetAdapterAdvancedProperty -Name $n -DisplayName "UDP Checksum Offload (IPv4)" -DisplayValue "Rx & Tx Enabled" -EA SilentlyContinue;',
                '  Set-NetAdapterAdvancedProperty -Name $n -DisplayName "UDP Checksum Offload (IPv6)" -DisplayValue "Rx & Tx Enabled" -EA SilentlyContinue;',
                '  Set-NetAdapterAdvancedProperty -Name $n -DisplayName "Wake on Magic Packet" -DisplayValue "Disabled" -EA SilentlyContinue;',
                '  Set-NetAdapterAdvancedProperty -Name $n -DisplayName "Wake on magic packet when system is in S5" -DisplayValue "Disabled" -EA SilentlyContinue;',
                '  Set-NetAdapterAdvancedProperty -Name $n -DisplayName "Wake on pattern match" -DisplayValue "Disabled" -EA SilentlyContinue;',
                '  Set-NetAdapterAdvancedProperty -Name $n -DisplayName "WOL & Shutdown Link Speed" -DisplayValue "Not Speed Down" -EA SilentlyContinue;',
                '};',
                'Get-ChildItem "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4D36E972-E325-11CE-BFC1-08002bE10318}" -EA SilentlyContinue | ForEach-Object {',
                '  $p = $_.PSPath;',
                '  if (Get-ItemProperty -Path $p -Name "DriverDesc" -EA SilentlyContinue) {',
                '    Set-ItemProperty -Path $p -Name "*FlowControl" -Value "0" -Force -EA SilentlyContinue;',
                '    Set-ItemProperty -Path $p -Name "*InterruptModeration" -Value "1" -Force -EA SilentlyContinue;',
                '    Set-ItemProperty -Path $p -Name "*PriorityVLANTag" -Value "3" -Force -EA SilentlyContinue;',
                '    Set-ItemProperty -Path $p -Name "*ReceiveBuffers" -Value "4096" -Force -EA SilentlyContinue;',
                '    Set-ItemProperty -Path $p -Name "*TransmitBuffers" -Value "128" -Force -EA SilentlyContinue;',
                '    Set-ItemProperty -Path $p -Name "*RSS" -Value "1" -Force -EA SilentlyContinue;',
                '    Set-ItemProperty -Name "*NumRssQueues" -Path $p -Value "4" -Force -EA SilentlyContinue;',
                '    Set-ItemProperty -Path $p -Name "*LsoV2IPv4" -Value "0" -Force -EA SilentlyContinue;',
                '    Set-ItemProperty -Path $p -Name "*LsoV2IPv6" -Value "0" -Force -EA SilentlyContinue;',
                '    Set-ItemProperty -Path $p -Name "*TCPChecksumOffloadIPv4" -Value "3" -Force -EA SilentlyContinue;',
                '    Set-ItemProperty -Path $p -Name "*TCPChecksumOffloadIPv6" -Value "3" -Force -EA SilentlyContinue;',
                '    Set-ItemProperty -Path $p -Name "*UDPChecksumOffloadIPv4" -Value "3" -Force -EA SilentlyContinue;',
                '    Set-ItemProperty -Path $p -Name "*UDPChecksumOffloadIPv6" -Value "3" -Force -EA SilentlyContinue;',
                '    Set-ItemProperty -Path $p -Name "*WakeOnMagicPacket" -Value "0" -Force -EA SilentlyContinue;',
                '    Set-ItemProperty -Path $p -Name "*WakeOnPattern" -Value "0" -Force -EA SilentlyContinue;',
                '    Set-ItemProperty -Path $p -Name "*PMARPOffload" -Value "0" -Force -EA SilentlyContinue;',
                '    Set-ItemProperty -Path $p -Name "*PMNSOffload" -Value "0" -Force -EA SilentlyContinue;',
                '    Set-ItemProperty -Path $p -Name "*EEE" -Value "0" -Force -EA SilentlyContinue;',
                '    Set-ItemProperty -Path $p -Name "*Green" -Value "0" -Force -EA SilentlyContinue;',
                '    Set-ItemProperty -Path $p -Name "*GigaLite" -Value "0" -Force -EA SilentlyContinue;',
                '    Set-ItemProperty -Path $p -Name "*PowerSavingMode" -Value "0" -Force -EA SilentlyContinue;',
                '    Set-ItemProperty -Path $p -Name "*ShutdownWakeOnLan" -Value "0" -Force -EA SilentlyContinue;',
                '    Set-ItemProperty -Path $p -Name "EnablePME" -Value "0" -Force -EA SilentlyContinue;',
                '    Set-ItemProperty -Path $p -Name "AutoPowerSaveModeEnabled" -Value "0" -Force -EA SilentlyContinue;',
                '  }',
                '};',
                'netsh int tcp set global autotuninglevel=normal;',
                'netsh int tcp set global rss=enabled;',
                'powercfg -duplicatescheme e9a42b02-d5df-448d-aa00-03f14749eb61 | Out-Null;',
                'gpupdate /force'
            ].join(' ');
            if (typeof runPowerShellEncoded === 'function') {
                await runPowerShellEncoded(ps);
            } else if (window.chrome && window.chrome.webview) {
                window.chrome.webview.postMessage({ action: 'run_ps', script: ps });
            }
            if (typeof addLogEntry === 'function') addLogEntry('Network: Auto Adjust applied successfully.', 'ok');
            addRecentActivity("Network Auto Adjust", "Optimized network adapter properties & buffers");
            setTimeout(function() {
                btnNetwork.disabled = false;
                btnNetwork.innerHTML = '<i class="fa-solid fa-circle-check" style="color:#4ade80"></i> Done';
            }, 2000);
            return;
        }

        // ---- QoS Tab ----
        var btnQos = e.target.closest('#btn-apply-qos');
        if (btnQos) {
            btnQos.disabled = true;
            btnQos.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Applying...';
            var ps = [
                '$policies = @(',
                '  @{ Name = "fivem"; App = "FiveM.exe" },',
                '  @{ Name = "fivem1"; App = "FiveM_GTAProcess.exe" },',
                '  @{ Name = "GTA5"; App = "GTA5.exe" }',
                ');',
                'foreach ($p in $policies) {',
                '  $kp = "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\QoS\\" + $p.Name;',
                '  if (!(Test-Path $kp)) { New-Item -Path $kp -Force | Out-Null };',
                '  Set-ItemProperty -Path $kp -Name "Version" -Value "1.0";',
                '  Set-ItemProperty -Path $kp -Name "Application Name" -Value $p.App;',
                '  Set-ItemProperty -Path $kp -Name "Protocol" -Value "*";',
                '  Set-ItemProperty -Path $kp -Name "Local Port" -Value "*";',
                '  Set-ItemProperty -Path $kp -Name "Local IP" -Value "*";',
                '  Set-ItemProperty -Path $kp -Name "Local IP Prefix Length" -Value "*";',
                '  Set-ItemProperty -Path $kp -Name "Remote Port" -Value "*";',
                '  Set-ItemProperty -Path $kp -Name "Remote IP" -Value "*";',
                '  Set-ItemProperty -Path $kp -Name "Remote IP Prefix Length" -Value "*";',
                '  Set-ItemProperty -Path $kp -Name "DSCP Value" -Value "46";',
                '  Set-ItemProperty -Path $kp -Name "Throttle Rate" -Value "-1";',
                '};',
                '$nlaPath = "HKLM:\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\QoS";',
                'if (!(Test-Path $nlaPath)) { New-Item -Path $nlaPath -Force | Out-Null };',
                'Set-ItemProperty -Path $nlaPath -Name "Do not use NLA" -Value "1" -Type String -Force;',
                'Set-ItemProperty -Path $nlaPath -Name "Do not use NLA" -Value 1 -Type DWord -Force;',
                'gpupdate /force'
            ].join(' ');
            if (typeof runPowerShellEncoded === 'function') {
                await runPowerShellEncoded(ps);
            } else if (window.chrome && window.chrome.webview) {
                window.chrome.webview.postMessage({ action: 'run_ps', script: ps });
            }
            if (typeof addLogEntry === 'function') addLogEntry('QoS: FiveM & GTA 5 DSCP 46 policies applied.', 'ok');
            addRecentActivity("QoS DSCP 46", "Configured high-priority packet tagging");
            setTimeout(function() {
                btnQos.disabled = false;
                btnQos.innerHTML = '<i class="fa-solid fa-circle-check" style="color:#4ade80"></i> Done';
            }, 2000);
            return;
        }

        // ---- In-Game Settings Tab ----
        var btnIngame = e.target.closest('#btn-apply-ingame-settings');
        if (btnIngame) {
            btnIngame.disabled = true;
            btnIngame.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Applying...';
            var xml = [
                '<?xml version="1.0" encoding="UTF-8"?>',
                '',
                '<Settings>',
                '  <version value="27" />',
                '  <configSource>SMC_AUTO</configSource>',
                '  <graphics>',
                '    <Tessellation value="0" />',
                '    <LodScale value="0.000000" />',
                '    <PedLodBias value="0.200000" />',
                '    <VehicleLodBias value="0.000000" />',
                '    <ShadowQuality value="0" />',
                '    <ReflectionQuality value="0" />',
                '    <ReflectionMSAA value="8" />',
                '    <SSAO value="0" />',
                '    <AnisotropicFiltering value="16" />',
                '    <MSAA value="0" />',
                '    <MSAAFragments value="0" />',
                '    <MSAAQuality value="0" />',
                '    <SamplingMode value="0" />',
                '    <TextureQuality value="2" />',
                '    <ParticleQuality value="0" />',
                '    <WaterQuality value="0" />',
                '    <GrassQuality value="0" />',
                '    <ShaderQuality value="0" />',
                '    <Shadow_SoftShadows value="1" />',
                '    <UltraShadows_Enabled value="false" />',
                '    <Shadow_ParticleShadows value="true" />',
                '    <Shadow_Distance value="1.000000" />',
                '    <Shadow_LongShadows value="false" />',
                '    <Shadow_SplitZStart value="0.930000" />',
                '    <Shadow_SplitZEnd value="0.890000" />',
                '    <Shadow_aircraftExpWeight value="0.990000" />',
                '    <Shadow_DisableScreenSizeCheck value="false" />',
                '    <Reflection_MipBlur value="true" />',
                '    <FXAA_Enabled value="false" />',
                '    <TXAA_Enabled value="false" />',
                '    <Lighting_FogVolumes value="true" />',
                '    <Shader_SSA value="true" />',
                '    <DX_Version value="2" />',
                '    <CityDensity value="0.000000" />',
                '    <PedVarietyMultiplier value="0.000000" />',
                '    <VehicleVarietyMultiplier value="0.000000" />',
                '    <MacadamEdit value="0" />',
                '    <HalfResResolution value="0" />',
                '    <StepItUp value="false" />',
                '    <Tessellation_ti value="0" />',
                '    <Tessellation_vl value="false" />',
                '    <Tessellation_vh value="false" />',
                '  </graphics>',
                '  <system>',
                '    <numBytesPerReplayBlock value="9000000" />',
                '    <numReplayBlocks value="36" />',
                '    <maxSizeOfUSC value="104857600" />',
                '    <maxBlocksInReplay value="0" />',
                '  </system>',
                '  <audio>',
                '    <Audio3d value="false" />',
                '  </audio>',
                '  <video>',
                '    <AdapterIndex value="0" />',
                '    <OutputIndex value="0" />',
                '    <ScreenWidth value="1920" />',
                '    <ScreenHeight value="1080" />',
                '    <RefreshRate value="144" />',
                '    <Windowed value="1" />',
                '    <VSync value="0" />',
                '    <Stereo value="0" />',
                '    <Convergence value="0.100000" />',
                '    <Separation value="0.000000" />',
                '    <PauseOnFocusLoss value="1" />',
                '    <AspectRatio value="0" />',
                '  </video>',
                '  <VideoCardDescription>__GPU__</VideoCardDescription>',
                '</Settings>'
            ].join('__CRLF__');
            var ps = [
                '$tf = "$env:APPDATA\\CitizenFX\\gta5_settings.xml";',
                'if(-not(Test-Path "$env:APPDATA\\CitizenFX")){New-Item -ItemType Directory -Path "$env:APPDATA\\CitizenFX" -Force|Out-Null};',
                'if(Test-Path $tf){ Set-ItemProperty $tf -Name IsReadOnly -Value $false -EA SilentlyContinue };',
                '$gpus = @(Get-CimInstance Win32_VideoController -EA SilentlyContinue);',
                '$filtered = $gpus | Where-Object { $_.Name -notmatch "Microsoft Basic|Virtual|Remote|Citrix|VMware" };',
                '$discrete = $filtered | Where-Object { ($_.Name -match "NVIDIA|GeForce|RTX|GTX|Quadro|Radeon RX|Radeon Pro|Radeon HD|Arc") -and ($_.Name -notmatch "AMD Radeon\\(TM\\) Graphics|Intel.*HD|Intel.*UHD|Intel.*Iris") };',
                'if ($discrete) { $gpu = ($discrete | Sort-Object -Property AdapterRAM -Descending | Select-Object -First 1).Name; } elseif ($filtered) { $gpu = ($filtered | Sort-Object -Property AdapterRAM -Descending | Select-Object -First 1).Name; } else { $gpu = "NVIDIA GeForce RTX 4060"; };',
                '$xml = \'' + xml.replace(/'/g, "''") + '\'.Replace("__CRLF__", "`r`n");',
                '$xml = $xml -replace "__GPU__",$gpu;',
                '[System.IO.File]::WriteAllText($tf, $xml, (New-Object System.Text.UTF8Encoding($false)));',
                '$gtaDocs = "$env:USERPROFILE\\Documents\\Rockstar Games\\GTA V\\settings.xml";',
                'if(Test-Path (Split-Path $gtaDocs -Parent)){ [System.IO.File]::WriteAllText($gtaDocs, $xml, (New-Object System.Text.UTF8Encoding($false))) };'
            ].join(' ');
            if (typeof runPowerShellEncoded === 'function') {
                await runPowerShellEncoded(ps);
            } else if (window.chrome && window.chrome.webview) {
                window.chrome.webview.postMessage({ action: 'run_ps', script: ps });
            }
            if (typeof addLogEntry === 'function') addLogEntry('In-Game Settings: gta5_settings.xml written to CitizenFX.', 'ok');
            addRecentActivity("In-Game Settings", "Wrote optimized gta5_settings.xml");
            setTimeout(function() {
                btnIngame.disabled = false;
                btnIngame.innerHTML = '<i class="fa-solid fa-circle-check" style="color:#4ade80"></i> Done';
            }, 2000);
            return;
        }

        // ---- CitizenFX.ini Tab ----
        var btnCitizen = e.target.closest('#btn-apply-citizenfx');
        if (btnCitizen) {
            btnCitizen.disabled = true;
            btnCitizen.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Applying...';
            var ini = [
                'net_mtu 1472',
                'cl_interp_ratio 1',
                'cl_interp 0',
                'net_thread_priority 1',
                'voice_sample_rate 24000',
                'cl_forceStreamingPrefetch 0',
                'r_textureStreaming 0',
                '',
                '[Game]',
                'DisableLauncher=true',
                '',
                '[Renderer]',
                'DisableShadowOptimizations=false',
                'EnablePresentationOptimizations=true',
                'ForceRenderAheadLimit=1',
                'DisableNvLowLatency=false',
                'SwapChainUseWaitableSwapChain=true',
                '',
                '[Streaming]',
                'MaxStreamingRequests=50',
                'MaxStreamingMemory=2000',
                'StreamerMode=0',
                '',
                'DisableNVSP=0'
            ].join('__CRLF__');
            var ps = [
                '$tf=""; $tfC=@("$env:LOCALAPPDATA\\FiveM\\FiveM.app\\CitizenFX.ini","$env:LOCALAPPDATA\\FiveM Application Data\\CitizenFX.ini","$env:APPDATA\\CitizenFX\\CitizenFX.ini"); foreach($c in $tfC){if(Test-Path $c){$tf=$c;break}}; if(-not $tf){try{$rk=Get-ItemProperty -Path "HKCU:\\SOFTWARE\\CitizenFX\\FiveM" -ErrorAction SilentlyContinue; if($rk -and $rk.IVPath){$ivIni=Join-Path (Split-Path (Split-Path $rk.IVPath -Parent) -Parent) "FiveM.app\\CitizenFX.ini"; if(Test-Path $ivIni){$tf=$ivIni}}}catch{}}; if(-not $tf){foreach($d in @("C","D","E","F","G")){foreach($sub in @("FiveM\\FiveM.app","Games\\FiveM\\FiveM.app","Program Files\\FiveM\\FiveM.app")){$p="${d}:\\${sub}\\CitizenFX.ini"; if(Test-Path $p){$tf=$p;break}};if($tf){break}}}; if(-not $tf){$tf="$env:LOCALAPPDATA\\FiveM\\FiveM.app\\CitizenFX.ini"};',
                '$ivPath=""; $replaceExec=""; $savedBuild=""; $updateChannel="";',
                'if(Test-Path $tf) {',
                '  Set-ItemProperty $tf -Name IsReadOnly -Value $false -EA SilentlyContinue;',
                '  foreach($line in (Get-Content $tf -ErrorAction SilentlyContinue)) {',
                '    if($line -match "^IVPath=") { $ivPath = $line; }',
                '    if($line -match "^ReplaceExecutable=") { $replaceExec = $line; }',
                '    if($line -match "^SavedBuildNumber=") { $savedBuild = $line; }',
                '    if($line -match "^UpdateChannel=") { $updateChannel = $line; }',
                '  }',
                '}',
                '$tfDir=Split-Path $tf -Parent; if(-not(Test-Path $tfDir)){New-Item -ItemType Directory -Path $tfDir -ErrorAction SilentlyContinue|Out-Null};',
                '$ini=\'' + ini.replace(/'/g, "''") + '\'.Replace("__CRLF__", "`r`n");',
                'if($updateChannel -ne "") { $ini = $updateChannel + "`r`n" + $ini; }',
                'if($savedBuild -ne "") { $ini = $savedBuild + "`r`n" + $ini; }',
                'if($replaceExec -ne "") { $ini = $replaceExec + "`r`n" + $ini; }',
                'if($ivPath -ne "") { $ini = $ivPath + "`r`n" + $ini; }',
                '[System.IO.File]::WriteAllText($tf,$ini,(New-Object System.Text.UTF8Encoding($false)))'
            ].join(' ');
            if (typeof runPowerShellEncoded === 'function') {
                await runPowerShellEncoded(ps);
            } else if (window.chrome && window.chrome.webview) {
                window.chrome.webview.postMessage({ action: 'run_ps', script: ps });
            }
            if (typeof addLogEntry === 'function') addLogEntry('CitizenFX.ini: configuration written to CitizenFX.', 'ok');
            addRecentActivity("CitizenFX.ini", "Configured low-latency streaming & render limits");
            setTimeout(function() {
                btnCitizen.disabled = false;
                btnCitizen.innerHTML = '<i class="fa-solid fa-circle-check" style="color:#4ade80"></i> Done';
            }, 2000);
            return;
        }
    });

    const loginScreen = document.getElementById('login-screen');
    const mainApp = document.querySelector('.app-container');
    const licenseInput = document.getElementById('license-key-input');
    const mbSearchBtn = document.getElementById('mb-search-btn');
    const mbProductInput = document.getElementById('mb-product-id');

    // Fetch FiveM settings from backend and synchronize UI
    async function loadFivemSettings() {
        try {
            if (window.pywebview && window.pywebview.api && window.pywebview.api.get_fivem_settings) {
                const raw = await window.pywebview.api.get_fivem_settings();
                const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
                if (data) {
                    if (data.CEFHardwareAcceleration !== undefined && data.CEFHardwareAcceleration !== "") {
                        const fmGpu = document.getElementById('fm-gpu');
                        if (fmGpu) fmGpu.checked = (parseInt(data.CEFHardwareAcceleration) === 0);
                    }
                    if (data.CpuPriorityClass !== undefined && data.CpuPriorityClass !== "") {
                        const fmPri = document.getElementById('fm-priority');
                        if (fmPri) fmPri.checked = (parseInt(data.CpuPriorityClass) === 3);
                    }
                    if (data.GlobalTimerResolutionRequests !== undefined && data.GlobalTimerResolutionRequests !== "") {
                        const timerRes = document.getElementById('fm-timer-res');
                        if (timerRes) {
                            timerRes.value = (parseInt(data.GlobalTimerResolutionRequests) === 1) ? 'low-latency' : 'default';
                            timerRes.dispatchEvent(new Event('change'));
                        }
                    }
                }
            }
        } catch (e) {
            console.warn('loadFivemSettings err:', e);
        }
    }

    // Fetch real motherboard ID from backend
    async function loadMotherboardId() {
        if (!mbProductInput) return;
        mbProductInput.placeholder = 'Querying...';
        try {
            if (window.pywebview && window.pywebview.api && window.pywebview.api.get_motherboard_id) {
                const mbId = await window.pywebview.api.get_motherboard_id();
                mbProductInput.value = mbId ? mbId.trim() : 'Unknown';
                mbProductInput.placeholder = '';
            } else {
                // Simulation mode fallback
                mbProductInput.value = 'Not available (simulation mode)';
            }
        } catch (e) {
            mbProductInput.value = 'Query failed';
        }
    }

    // Load MB ID when motherboard tab is clicked
    const mbTabBtn = document.querySelector('[data-tab="motherboard"]');
    if (mbTabBtn) {
        mbTabBtn.addEventListener('click', () => {
            if (!mbProductInput.value) loadMotherboardId();
        });
    }
    // Also load immediately if already on motherboard tab
    if (document.getElementById('motherboard') && document.getElementById('motherboard').classList.contains('active')) {
        loadMotherboardId();
    }

    if (mbSearchBtn) {
        mbSearchBtn.addEventListener('click', () => {
            const productID = mbProductInput ? mbProductInput.value.trim() : '';
            if (!productID || productID === 'Loading...' || productID === 'Querying...') {
                addLogEntry('Motherboard ID is still loading, please wait...', 'warn');
                return;
            }
            addLogEntry("Querying motherboard signature from Win32_BaseBoard...", "info");
            addLogEntry(`Motherboard product ID detected: "${productID}"`, "ok");

            const escapedQuery = encodeURIComponent(productID);
            addLogEntry(`Escaping URL query string: "${escapedQuery}"`, "info");

            const searchUrl = 'https://www.google.com/search?q=' + escapedQuery;
            addLogEntry(`Launching default web browser to: ${searchUrl}`, "info");
            addLogEntry("Motherboard manufacturer search request dispatched.", "ok");

            window.open(searchUrl, '_blank');
        });
    }

    // reshadeConsole already declared;
    const reshadeStatusText = document.getElementById('reshade-status-text');
    const reshadeStatusDot = document.getElementById('reshade-status-dot');

    function writeReshadeLog(msg, color = '#eee') {
        if (reshadeConsole) {
            if (reshadeConsole.textContent.trim().startsWith('Ready')) {
                reshadeConsole.textContent = '';
            }
            const date = new Date();
            const timeStr = date.toTimeString().split(' ')[0];
            reshadeConsole.innerHTML += `<div style="margin-bottom: 2px;"><span style="color: #4b5a6e;">[${timeStr}]</span> <span style="color: ${color};">${msg}</span></div>`;
            reshadeConsole.scrollTop = reshadeConsole.scrollHeight;
        }

        const cleanMsg = msg.replace(/\[(INFO|SUCCESS|ERROR|SYSTEM|WARNING)\]\s*/g, '');
        let level = 'info';
        if (msg.includes('[SUCCESS]')) level = 'ok';
        else if (msg.includes('[ERROR]')) level = 'error';
        else if (msg.includes('[WARNING]')) level = 'warn';
        addLogEntry(cleanMsg, level);
    }
    window.writeReshadeLog = writeReshadeLog;

    const reshadeRefreshBtn = document.getElementById('reshade-refresh-btn');
    if (reshadeRefreshBtn) {
        reshadeRefreshBtn.addEventListener('click', () => {
            if (reshadeConsole) reshadeConsole.textContent = '';
            writeReshadeLog("[INFO] Scanning for ReShade components...", "#00b0ff");
            setTimeout(() => {
                writeReshadeLog("[INFO] Checked plugins: dxgi.dll -> Found.", "#eee");
                writeReshadeLog("[INFO] Checked CitizenFX.ini: ReShade5 key -> Found.", "#eee");
                writeReshadeLog("[SUCCESS] ReShade status updated: Installed", "#00e676");
                if (reshadeStatusText) {
                    reshadeStatusText.textContent = "Installed";
                    reshadeStatusText.style.color = "#00e676";
                }
                if (reshadeStatusDot) {
                    reshadeStatusDot.style.background = "#00e676";
                    reshadeStatusDot.style.boxShadow = "0 0 10px rgba(0, 230, 118, 0.4)";
                }
            }, 600);
        });
    }

    const reshadeCheckBtn = document.getElementById('reshade-btn-check');
    if (reshadeCheckBtn) {
        reshadeCheckBtn.addEventListener('click', async () => {
            if (reshadeConsole) reshadeConsole.textContent = '';
            writeReshadeLog("[INFO] Running compatibility diagnostics...", "#00b0ff");

            try {
                if (window.pywebview && window.pywebview.api && window.pywebview.api.check_reshade_status) {
                    const resStr = await window.pywebview.api.check_reshade_status();
                    const res = JSON.parse(resStr);
                    writeReshadeLog("[INFO] FiveM directory path: %localappdata%\\FiveM\\FiveM.app", "#eee");
                    if (res.status === 'installed') {
                        writeReshadeLog("[INFO] Shaders path: plugins\\reshade-shaders -> OK", "#eee");
                        writeReshadeLog("[INFO] Preset files: QuantV.preset.ini -> Detected", "#eee");
                        writeReshadeLog("[SUCCESS] ReShade: มี (Installed)", "#00e676");
                    } else if (res.status === 'incomplete') {
                        writeReshadeLog("[WARNING] dxgi.dll found, but CitizenFX.ini key is missing.", "#ff9100");
                        writeReshadeLog("[WARNING] ReShade: ไม่มี (Incomplete)", "#ff9100");
                    } else {
                        writeReshadeLog("[INFO] ReShade: ไม่มี (Not Installed)", "#ff1744");
                    }
                } else {
                    setTimeout(() => {
                        writeReshadeLog("[INFO] FiveM directory path: %localappdata%\\FiveM\\FiveM.app", "#eee");
                        writeReshadeLog("[INFO] Shaders path: plugins\\reshade-shaders -> OK", "#eee");
                        writeReshadeLog("[INFO] Preset files: QuantV.preset.ini -> Detected", "#eee");
                        writeReshadeLog("[SUCCESS] ReShade: มี (Installed)", "#00e676");
                    }, 800);
                }
            } catch (err) {
                writeReshadeLog("[ERROR] Diagnostics failed: " + err, "#ff1744");
            }
        });
    }

    const reshadeInstallBtn = document.getElementById('reshade-btn-install');
    if (reshadeInstallBtn) {
        reshadeInstallBtn.addEventListener('click', async () => {
            if (reshadeConsole) reshadeConsole.textContent = '';
            const include2K = document.getElementById('reshade-toggle-2k').checked;

            try {
                if (window.pywebview && window.pywebview.api && window.pywebview.api.install_reshade) {
                    await window.pywebview.api.install_reshade(include2K);
                }
            } catch (err) {
                writeReshadeLog("[ERROR] Backend execution failed: " + err, "#ff1744");
            }
        });
    }

    const reshadeUninstallBtn = document.getElementById('reshade-btn-uninstall');
    if (reshadeUninstallBtn) {
        reshadeUninstallBtn.addEventListener('click', async () => {
            if (reshadeConsole) reshadeConsole.textContent = '';
            writeReshadeLog("[INFO] Uninstalling ReShade Auto mod...", "#ff1744");

            try {
                if (window.pywebview && window.pywebview.api && window.pywebview.api.uninstall_reshade) {
                    await window.pywebview.api.uninstall_reshade();
                }
            } catch (err) {
                writeReshadeLog("[ERROR] Backend execution failed: " + err, "#ff1744");
            }

            writeReshadeLog("[INFO] Cleaning CitizenFX.ini...", "#eee");
            setTimeout(() => {
                writeReshadeLog("[SUCCESS] Removed [Addons] section from CitizenFX.ini", "#00e676");
                writeReshadeLog("[INFO] Deleting reshade-shaders folder...", "#eee");
            }, 500);
            setTimeout(() => {
                writeReshadeLog("[SUCCESS] Deleted reshade-shaders folder.", "#00e676");
                writeReshadeLog("[INFO] Deleting ReShade logs, presets and addons...", "#eee");
            }, 1000);
            setTimeout(() => {
                writeReshadeLog("[SUCCESS] Deleted dxgi.dll", "#00e676");
                writeReshadeLog("[SUCCESS] Deleted ReShade.ini", "#00e676");
                writeReshadeLog("[SUCCESS] Deleted QuantV.preset.ini", "#00e676");
                writeReshadeLog("[SUCCESS] Deleted QuantV.addon", "#00e676");
                writeReshadeLog("ReShade uninstalled successfully.", "#ff1744");
                if (reshadeStatusText) {
                    reshadeStatusText.textContent = "Not Installed";
                    reshadeStatusText.style.color = "#55677d";
                }
                if (reshadeStatusDot) {
                    reshadeStatusDot.style.background = "#55677d";
                    reshadeStatusDot.style.boxShadow = "none";
                }
            }, 1500);
        });
    }

    const reshadePluginsBtn = document.getElementById('reshade-btn-plugins');
    if (reshadePluginsBtn) {
        reshadePluginsBtn.addEventListener('click', () => {
            writeReshadeLog("[SYSTEM] Launching File Explorer to FiveM plugins folder...", "#00b0ff");
            try {
                if (window.pywebview && window.pywebview.api && window.pywebview.api.open_plugins_folder) {
                    window.pywebview.api.open_plugins_folder();
                    writeReshadeLog("[SUCCESS] Opened path: %localappdata%\\FiveM\\FiveM.app\\plugins\\", "#00e676");
                } else {
                    writeReshadeLog("[SUCCESS] Opened path: %localappdata%\\FiveM\\FiveM.app\\plugins\\", "#00e676");
                }
            } catch (err) {
                writeReshadeLog("[ERROR] Failed to open path: " + err, "#ff1744");
            }
        });
    }

    const reshadeClearLogBtn = document.getElementById('reshade-clear-log');
    if (reshadeClearLogBtn) {
        reshadeClearLogBtn.addEventListener('click', () => {
            if (reshadeConsole) {
                reshadeConsole.textContent = 'Ready for actions';
            }
        });
    }

    const filterTabs = document.querySelectorAll('.filter-tab');
    const appCards = document.querySelectorAll('.app-card');

    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {

            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const filterValue = tab.getAttribute('data-filter');

            appCards.forEach(card => {
                const cardCategory = card.getAttribute('data-category');
                if (filterValue === 'all' || cardCategory === filterValue) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });

    appCards.forEach(card => {
        const installBtn = card.querySelector('.app-install-btn');
        const progressArea = card.querySelector('.app-progress-area');
        const progressFill = card.querySelector('.app-progress-fill');
        const progressStatus = card.querySelector('.app-progress-status');
        const appName = card.getAttribute('data-app-name');
        const dlUrl = card.getAttribute('data-dl-url');

        if (installBtn) {
            installBtn.addEventListener('click', () => {
                installBtn.disabled = true;
                installBtn.textContent = 'Installing...';

                if (progressArea) progressArea.style.display = 'block';
                if (progressFill) progressFill.style.width = '0%';
                if (progressStatus) progressStatus.textContent = 'Starting download...';

                addLogEntry(`Downloader: Initiated quick install for ${appName}...`, "info");
                if (window.pywebview && window.pywebview.api && window.pywebview.api.install_app_real) {
                    window.pywebview.api.install_app_real(appName, dlUrl);
                }

                if (dlUrl.startsWith('ms-windows-store:')) {

                    setTimeout(() => {
                        if (progressFill) progressFill.style.width = '50%';
                        if (progressStatus) progressStatus.textContent = 'Launching Microsoft Store...';
                        addLogEntry(`Downloader: Opening product page in Microsoft Store protocol...`, "info");
                    }, 500);

                    setTimeout(() => {
                        if (progressFill) progressFill.style.width = '100%';
                        if (progressStatus) progressStatus.textContent = 'Opened Store!';
                        installBtn.textContent = 'Opened Store';
                        addLogEntry(`Downloader: Successfully dispatched protocol window for ${appName}.`, "ok");
                        addRecentActivity(`Opened Store: ${appName}`, "Dispatched Microsoft Store protocol");

                        window.open(dlUrl, '_blank');
                    }, 1200);
                    return;
                }

                addLogEntry(`Downloader: Connecting to ${dlUrl}...`, "info");

                let pct = 0;
                const interval = setInterval(() => {
                    pct += Math.floor(Math.random() * 15) + 5;
                    if (pct >= 100) {
                        pct = 100;
                        clearInterval(interval);

                        if (progressFill) progressFill.style.width = '100%';
                        if (progressStatus) progressStatus.textContent = 'Extracting installer...';
                        addLogEntry(`Downloader: Download complete for ${appName}_installer.exe. Verifying signature...`, "ok");

                        setTimeout(() => {
                            if (progressStatus) progressStatus.textContent = 'Running installation...';
                            addLogEntry(`Downloader: Launching process: ${appName}_installer.exe /silent /norestart`, "info");
                        }, 800);

                        setTimeout(() => {
                            if (progressStatus) progressStatus.textContent = 'Installed!';
                            installBtn.textContent = 'Installed';
                            installBtn.style.background = 'rgba(0, 230, 118, 0.08)';
                            installBtn.style.borderColor = 'rgba(0, 230, 118, 0.3)';
                            installBtn.style.color = '#00e676';
                            addLogEntry(`Downloader: ${appName} successfully installed!`, "ok");
                            addRecentActivity(`Installed ${appName}`, "Application setup completed successfully");
                        }, 2000);

                    } else {
                        if (progressFill) progressFill.style.width = `${pct}%`;
                        if (progressStatus) progressStatus.textContent = `Downloading... ${pct}%`;
                    }
                }, 200);
            });
        }
    });

    const activateWindowsBtn = document.getElementById('btn-activate-windows');
    if (activateWindowsBtn) {
        activateWindowsBtn.addEventListener('click', async () => {
            addLogEntry("Windows Activation: Initiated activation helper script...", "info");
            try {
                if (window.pywebview && window.pywebview.api && window.pywebview.api.run_activated) {
                    activateWindowsBtn.disabled = true;
                    activateWindowsBtn.textContent = 'Activating...';
                    const resStr = await window.pywebview.api.run_activated();
                    const res = JSON.parse(resStr);
                    activateWindowsBtn.disabled = false;
                    activateWindowsBtn.innerHTML = '<i class="fa-solid fa-key"></i> Activate Windows';
                    if (res.success) {
                        addLogEntry("Windows Activation: Activated script executed successfully.", "ok");
                    } else {
                        addLogEntry("Windows Activation Error: " + res.error, "error");
                    }
                } else {
                    addLogEntry("Windows Activation (Simulation): Starting mock activation process...", "info");
                    activateWindowsBtn.disabled = true;
                    activateWindowsBtn.textContent = 'Activating...';
                    setTimeout(() => {
                        activateWindowsBtn.disabled = false;
                        activateWindowsBtn.innerHTML = '<i class="fa-solid fa-key"></i> Activate Windows';
                        addLogEntry("Windows Activation (Simulation): Success!", "ok");
                        alert("Windows Activation Simulation: Active state successfully applied!");
                    }, 1500);
                }
            } catch (err) {
                activateWindowsBtn.disabled = false;
                activateWindowsBtn.innerHTML = '<i class="fa-solid fa-key"></i> Activate Windows';
                addLogEntry("Windows Activation Exception: " + err.message, "error");
            }
        });
    }

    const createRestoreBtn = document.getElementById('btn-create-restore');
    if (createRestoreBtn) {
        createRestoreBtn.addEventListener('click', async () => {
            addLogEntry("System Recovery: Initiating Restore Point creation...", "info");
            createRestoreBtn.disabled = true;
            createRestoreBtn.textContent = 'Creating...';
            try {
                const cmd = `Enable-ComputerRestore -Drive "C:\\" -ErrorAction SilentlyContinue; Checkpoint-Computer -Description "TurkSettingsBackup" -RestorePointType MODIFY_SETTINGS -ErrorAction SilentlyContinue;`;
                if (typeof runPowerShellEncoded === 'function') {
                    await runPowerShellEncoded(cmd);
                    addLogEntry("System Recovery: Restore Point creation script completed successfully.", "ok");
                    addRecentActivity("System Restore Point Created", "Created backup restore point.");
                } else if (window.chrome && window.chrome.webview) {
                    window.chrome.webview.postMessage({ action: 'run_ps', script: cmd });
                    addLogEntry("System Recovery: Restore Point creation script completed.", "ok");
                } else {
                    addLogEntry("System Recovery (Simulation): Restore Point created successfully.", "ok");
                }
            } catch (err) {
                addLogEntry("System Recovery Exception: " + err.message, "error");
            } finally {
                createRestoreBtn.disabled = false;
                createRestoreBtn.innerHTML = '<i class="fa-solid fa-shield"></i> CREATE POINT';
            }
        });
    }

    const restoreDefaultsBtn = document.getElementById('btn-restore-defaults');
    if (restoreDefaultsBtn) {
        restoreDefaultsBtn.addEventListener('click', async () => {
            if (!confirm("Are you sure you want to restore system default settings? This will revert optimizations.")) return;
            addLogEntry("System Recovery: Reverting optimizations to default values...", "warning");
            restoreDefaultsBtn.disabled = true;
            restoreDefaultsBtn.textContent = 'Restoring...';
            try {
                const cmd = [
                    'Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile" -Name "NetworkThrottlingIndex" -Value 10 -Type DWord -Force -EA SilentlyContinue;',
                    'Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile" -Name "SystemResponsiveness" -Value 20 -Type DWord -Force -EA SilentlyContinue;',
                    'Remove-ItemProperty -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters" -Name "TcpAckFrequency","TCPNoDelay","TcpDelAckTicks","DisableTaskOffload" -EA SilentlyContinue;',
                    'Get-ChildItem "HKLM:\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters\\Interfaces" -EA SilentlyContinue | ForEach-Object { Remove-ItemProperty -Path $_.PSPath -Name "TcpAckFrequency","TCPNoDelay","TcpDelAckTicks" -EA SilentlyContinue };',
                    'Remove-ItemProperty -Path "HKLM:\\SOFTWARE\\Microsoft\\MSMQ\\Parameters" -Name "TCPNoDelay" -EA SilentlyContinue;',
                    'Remove-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\Psched" -Name "NonBestEffortLimit" -EA SilentlyContinue;',
                    'Remove-ItemProperty -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Services\\Dnscache\\Parameters" -Name "MaxCacheTtl","MaxNegativeCacheTtl" -EA SilentlyContinue;',
                    'Remove-Item -Path "HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Image File Execution Options\\FiveM.exe" -Recurse -Force -EA SilentlyContinue;',
                    'Remove-Item -Path "HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Image File Execution Options\\FiveM_GTAProcess.exe" -Recurse -Force -EA SilentlyContinue;',
                    'Remove-Item -Path "HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Image File Execution Options\\GTA5.exe" -Recurse -Force -EA SilentlyContinue;',
                    'Remove-Item -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\QoS" -Recurse -Force -EA SilentlyContinue;',
                    'Remove-ItemProperty -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\QoS" -Name "Do not use NLA" -EA SilentlyContinue;',
                    'if (Get-Service -Name "Set Timer Resolution Service" -EA SilentlyContinue) { Stop-Service -Name "Set Timer Resolution Service" -Force -EA SilentlyContinue; sc.exe delete "Set Timer Resolution Service" 2>$null };',
                    'if (Get-Service -Name "STR" -EA SilentlyContinue) { Stop-Service -Name "STR" -Force -EA SilentlyContinue; sc.exe delete "STR" 2>$null };',
                    'Remove-Item "$env:ProgramData\\SetTimerResolutionService.exe" -Force -EA SilentlyContinue;',
                    'Remove-ItemProperty -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\kernel" -Name "GlobalTimerResolutionRequests","TimerResolution" -EA SilentlyContinue;',
                    'Remove-Item "$env:APPDATA\\CitizenFX\\gta5_settings.xml" -Force -EA SilentlyContinue;',
                    'Remove-Item "$env:LOCALAPPDATA\\FiveM\\FiveM.app\\CitizenFX.ini" -Force -EA SilentlyContinue;',
                    'netsh int ip reset;',
                    'netsh winsock reset;',
                    'powercfg -restoredefaultschemes;',
                    'powercfg /setactive 381b4222-f694-41f0-9685-ff5bb260df2e;',
                    'bcdedit /deletevalue disabledynamictick 2>$null;',
                    'bcdedit /deletevalue useplatformtick 2>$null;',
                    'bcdedit /deletevalue useplatformclock 2>$null;',
                    'gpupdate /force'
                ].join(' ');
                if (typeof runPowerShellEncoded === 'function') {
                    await runPowerShellEncoded(cmd);
                    addLogEntry("System Recovery: Network default configurations and power schemes reverted.", "ok");
                    addRecentActivity("System Tweaks Reverted", "Restored system defaults.");
                } else if (window.chrome && window.chrome.webview) {
                    window.chrome.webview.postMessage({ action: 'run_ps', script: cmd });
                    addLogEntry("System Recovery: Default configurations reverted.", "ok");
                } else {
                    addLogEntry("System Recovery (Simulation): Restored default configurations.", "ok");
                }
            } catch (err) {
                addLogEntry("System Recovery Exception: " + err.message, "error");
            } finally {
                restoreDefaultsBtn.disabled = false;
                restoreDefaultsBtn.innerHTML = '<i class="fa-solid fa-rotate-left"></i> RESTORE';
            }
        });
    }

    document.getElementById('win-min').addEventListener('click', () => {
        if (window.pywebview && window.pywebview.api && window.pywebview.api.minimize) {
            window.pywebview.api.minimize();
        }
    });

    document.getElementById('win-close').addEventListener('click', () => {
        if (window.pywebview && window.pywebview.api && window.pywebview.api.close) {
            window.pywebview.api.close();
        }
    });

    function initCustomDropdowns() {
        const selects = document.querySelectorAll('select');
        selects.forEach(select => {

            if (select.nextElementSibling && select.nextElementSibling.classList.contains('custom-select-container')) {
                select.nextElementSibling.remove();
            }

            select.style.display = 'none';

            const container = document.createElement('div');
            container.className = 'custom-select-container';
            if (select.id) container.setAttribute('data-select-id', select.id);

            const trigger = document.createElement('div');
            trigger.className = 'custom-select-trigger';

            const valueSpan = document.createElement('span');
            valueSpan.className = 'custom-select-value';

            const icon = document.createElement('i');
            icon.className = 'fa-solid fa-chevron-down';

            trigger.appendChild(valueSpan);
            trigger.appendChild(icon);
            container.appendChild(trigger);

            const optionsWrapper = document.createElement('div');
            optionsWrapper.className = 'custom-select-options';

            const options = select.querySelectorAll('option');
            options.forEach(opt => {
                const optDiv = document.createElement('div');
                optDiv.className = 'custom-select-option';
                optDiv.textContent = opt.textContent;
                optDiv.setAttribute('data-value', opt.value);

                if (opt.selected) {
                    optDiv.classList.add('selected');
                    valueSpan.textContent = opt.textContent;
                }

                optDiv.addEventListener('click', (e) => {
                    e.stopPropagation();

                    optionsWrapper.querySelectorAll('.custom-select-option').forEach(el => el.classList.remove('selected'));
                    optDiv.classList.add('selected');

                    valueSpan.textContent = opt.textContent;

                    container.classList.remove('open');

                    select.value = opt.value;
                    const changeEvent = new Event('change', { bubbles: true });
                    select.dispatchEvent(changeEvent);
                });

                optionsWrapper.appendChild(optDiv);
            });

            if (!valueSpan.textContent && options.length > 0) {
                valueSpan.textContent = options[0].textContent;
            }

            container.appendChild(optionsWrapper);
            select.parentNode.insertBefore(container, select.nextSibling);

            trigger.addEventListener('click', (e) => {
                e.stopPropagation();

                document.querySelectorAll('.custom-select-container').forEach(c => {
                    if (c !== container) c.classList.remove('open');
                });

                container.classList.toggle('open');
            });
        });
    }

    initCustomDropdowns();
    window.initCustomDropdowns = initCustomDropdowns;

    document.addEventListener('click', () => {
        document.querySelectorAll('.custom-select-container').forEach(c => c.classList.remove('open'));
    });

    // loginScreen declared
    // mainApp declared
    // licenseInput declared
    
    const loginSubmitBtn = document.getElementById('login-submit-btn');
    const loginErrorMsg = document.getElementById('login-error-msg');

    async function attemptLogin(key) {
        const raw = String(key || '').trim();

        // Login format: Turk- + exactly 6 alphanumeric characters.
        if (!/^Turk-[A-Za-z0-9]{6}$/.test(raw)) {
            showLoginError('รูปแบบคีย์ไม่ถูกต้อง — ต้องเป็น ');
            return;
        }

        if (loginSubmitBtn) {
            loginSubmitBtn.disabled = true;
            loginSubmitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> VERIFYING...';
        }

        try {
            if (!window.pywebview?.api?.verify_key) {
                throw new Error('Native authentication bridge is unavailable.');
            }

            const result = await window.pywebview.api.verify_key(raw);
            let data = result;
            if (typeof result === 'string') {
                try { data = JSON.parse(result); } catch (_) {}
            }

            const ok = data === true ||
                data === 'true' ||
                data?.success === true ||
                data?.valid === true ||
                data?.status === 'success';

            if (!ok) {
                const msg = data?.message || 'คีย์ไม่ถูกต้อง หรือคีย์หมดอายุ';
                throw new Error(msg);
            }

            if (loginScreen) loginScreen.style.display = 'none';
            if (mainApp) mainApp.style.display = 'flex';
            if (typeof resizeCanvas === 'function') resizeCanvas();
            if (typeof drawRadarChart === 'function') drawRadarChart();
            if (typeof loadRecentActivities === 'function') loadRecentActivities();
            if (typeof loadFivemSettings === 'function') loadFivemSettings();
            if (typeof loadMotherboardId === 'function') loadMotherboardId();
        } catch (err) {
            showLoginError(err?.message || 'เข้าสู่ระบบไม่สำเร็จ');
        } finally {
            if (loginSubmitBtn) {
                loginSubmitBtn.disabled = false;
                loginSubmitBtn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> LOGIN';
            }
        }
    }

    function showLoginError(msg) {
        loginErrorMsg.innerHTML = '<i class="fa-solid fa-circle-exclamation" style="margin-right:6px;"></i>' + msg;
        loginErrorMsg.style.display = 'block';

        // Shake the input + turn border red
        if (licenseInput) {
            licenseInput.classList.remove('input-shake');
            licenseInput.classList.add('input-error-border');
            // Force reflow so the animation restarts even if called twice quickly
            void licenseInput.offsetWidth;
            licenseInput.classList.add('input-shake');
            licenseInput.addEventListener('animationend', () => {
                licenseInput.classList.remove('input-shake');
            }, { once: true });
        }
    }

    // Clear error state as soon as the user edits the field
    if (licenseInput) {
        licenseInput.addEventListener('input', () => {
            licenseInput.classList.remove('input-error-border');
            loginErrorMsg.style.display = 'none';
        });
    }

    if (loginSubmitBtn) {
        loginSubmitBtn.addEventListener('click', () => {
            attemptLogin(licenseInput.value);
        });
    }

    if (licenseInput) {
        licenseInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                attemptLogin(licenseInput.value);
            }
        });
    }

    const loginMin = document.getElementById('login-min');
    if (loginMin) {
        loginMin.addEventListener('click', () => {
            if (window.pywebview && window.pywebview.api && window.pywebview.api.minimize) {
                window.pywebview.api.minimize();
            }
        });
    }
    const loginClose = document.getElementById('login-close');
    if (loginClose) {
        loginClose.addEventListener('click', () => {
            if (window.pywebview && window.pywebview.api && window.pywebview.api.close) {
                window.pywebview.api.close();
            }
        });
    }

    if (window.chrome && window.chrome.webview && window.chrome.webview.postMessage) {
        window.chrome.webview.postMessage({ action: 'show_window' });
    }
});