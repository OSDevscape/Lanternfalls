(function () {
    var TBRM_KEY = 'lanternfalls-monthly-tbr-v1';

    function read(key, fallback) {
        try {
            return JSON.parse(localStorage.getItem(key) || fallback);
        } catch (_) {
            return JSON.parse(fallback);
        }
    }

    var APPEARANCE_KEY = 'bookshelf-appearance';

    var ACCENT_COLORS = {
        red: '#8B3A3A',
        blue: '#3976B8',
        green: '#4C6B4F',
        yellow: '#B88918',
        teal: '#278A86',
        purple: '#76539A',
        orange: '#C66A25',
        brown: '#76513E',
        pink: '#C94C7C',
        cyan: '#1D9EB7'
    };

    function currentAccent() {
        var saved = read(
            APPEARANCE_KEY,
            '{"mode":"dark","accent":"red"}'
        );

        return ACCENT_COLORS[saved.accent] || ACCENT_COLORS.red;
    }

    function hexToRgb(hex) {
        var value = String(hex || '').replace('#', '');

        if (value.length === 3) {
            value = value.charAt(0) + value.charAt(0) +
                value.charAt(1) + value.charAt(1) +
                value.charAt(2) + value.charAt(2);
        }

        var number = parseInt(value, 16);

        if (isNaN(number)) {
            return { r: 139, g: 58, b: 58 };
        }

        return {
            r: (number >> 16) & 255,
            g: (number >> 8) & 255,
            b: number & 255
        };
    }

    function rgba(hex, alpha) {
        var color = hexToRgb(hex);

        return 'rgba(' +
            color.r + ',' +
            color.g + ',' +
            color.b + ',' +
            alpha + ')';
    }

    function darkenHex(hex, amount) {
        var color = hexToRgb(hex);
        var multiplier = Math.max(0, Math.min(1, 1 - amount));

        function channel(value) {
            return Math.round(value * multiplier)
                .toString(16)
                .padStart(2, '0');
        }

        return '#' +
            channel(color.r) +
            channel(color.g) +
            channel(color.b);
    }

    function write(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function pad(value) {
        return String(value).padStart(2, '0');
    }

    function currentMonthKey() {
        var now = new Date();

        return now.getFullYear() + '-' + pad(now.getMonth() + 1);
    }

    function monthLabel(monthKey) {
        var parts = String(monthKey || '').split('-');
        var year = Number(parts[0]);
        var month = Number(parts[1]) - 1;
        var names = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        return names[month] + ' ' + year;
    }

    function getState() {
        var saved = read(TBRM_KEY, '{}');

        return saved && typeof saved === 'object' ? saved : {};
    }

    function getMonthIds(monthKey) {
        var state = getState();
        var ids = state[monthKey];

        return Array.isArray(ids) ? ids : [];
    }

    function saveMonthIds(monthKey, ids) {
        var state = getState();

        state[monthKey] = ids;

        write(TBRM_KEY, state);

        window.dispatchEvent(
            new CustomEvent('lanternfalls-monthly-tbr-changed', {
                detail: {
                    month: monthKey,
                    ids: ids.slice()
                }
            })
        );
    }

    function isInCurrentMonth(bookId) {
        return getMonthIds(currentMonthKey()).indexOf(bookId) !== -1;
    }

    function toggleBook(bookId) {
        if (!bookId) {
            return false;
        }

        var month = currentMonthKey();
        var ids = getMonthIds(month);
        var index = ids.indexOf(bookId);

        if (index === -1) {
            ids.push(bookId);
            saveMonthIds(month, ids);
            return true;
        }

        ids.splice(index, 1);
        saveMonthIds(month, ids);
        return false;
    }

    function currentBooks() {
        var ids = getMonthIds(currentMonthKey());
        var books = read('bookshelf-data', '{"books":[]}').books || [];
        var byId = {};

        books.forEach(function (book) {
            byId[book.id] = book;
        });

        return ids
            .map(function (id) {
                return byId[id] || null;
            })
            .filter(Boolean);
    }

    function updateDetailButton(button, bookId) {
        if (!button) {
            return;
        }

        var month = currentMonthKey();
        var selected = isInCurrentMonth(bookId);

        button.textContent = selected
            ? 'Remove from ' + monthLabel(month) + ' TBR'
            : 'Add to ' + monthLabel(month) + ' TBR';

        button.classList.toggle('is-selected', selected);
        button.setAttribute(
            'aria-pressed',
            selected ? 'true' : 'false'
        );
    }

    function attachDetailButton(book) {
        if (!book || !book.id) {
            return;
        }

        var view = document.getElementById('bookDetails');

        if (!view || view.classList.contains('hidden')) {
            return;
        }

        var old = view.querySelector('.bd-tbr-button');

        if (old) {
            old.remove();
        }

        var panel = view.querySelector('.bd-panel');

        if (!panel) {
            return;
        }

        var chips = view.querySelector('.bd-chips');

        if (!chips) {
            return;
        }

        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'bd-tbr-button';

        updateDetailButton(button, book.id);

        button.onclick = function () {
            var added = toggleBook(book.id);

            updateDetailButton(button, book.id);

            var toast = document.getElementById('toast');

            if (toast) {
                toast.textContent = added
                    ? 'Added to ' + monthLabel(currentMonthKey()) + ' TBR'
                    : 'Removed from ' + monthLabel(currentMonthKey()) + ' TBR';

                toast.classList.remove('hidden');

                clearTimeout(window.__tbrmToastTimer);

                window.__tbrmToastTimer = setTimeout(function () {
                    toast.classList.add('hidden');
                }, 2400);
            }
        };

        chips.insertAdjacentElement('beforebegin', button);
    }

    function closeTbrWindow() {
        var tbrWindow = document.getElementById('monthlyTbrWindow');

        if (tbrWindow) {
            tbrWindow.classList.add('hidden');
            tbrWindow.scrollTop = 0;
        }
    }

    function showToast(message) {
        var toast = document.getElementById('toast');

        if (!toast) {
            return;
        }

        toast.textContent = message;
        toast.classList.remove('hidden');

        clearTimeout(showToast.timer);

        showToast.timer = setTimeout(function () {
            toast.classList.add('hidden');
        }, 2400);
    }

    function removeBook(bookId) {
        var month = currentMonthKey();
        var ids = getMonthIds(month).filter(function (id) {
            return id !== bookId;
        });

        saveMonthIds(month, ids);
        renderWindow();
    }

    function titleLines(context, title, maxWidth, maxLines) {
        var words = String(title || 'Untitled').trim().split(/\s+/);
        var lines = [];
        var line = '';

        words.forEach(function (word) {
            var candidate = line ? line + ' ' + word : word;

            if (context.measureText(candidate).width <= maxWidth || !line) {
                line = candidate;
                return;
            }

            if (lines.length < maxLines - 1) {
                lines.push(line);
                line = word;
            }
        });

        if (line && lines.length < maxLines) {
            lines.push(line);
        }

        if (
            words.join(' ').length >
            lines.join(' ').length &&
            lines.length
        ) {
            var last = lines.length - 1;

            while (
                lines[last].length > 1 &&
                context.measureText(lines[last] + '…').width > maxWidth
            ) {
                lines[last] = lines[last].slice(0, -1);
            }

            lines[last] += '…';
        }

        return lines;
    }

    function roundedRect(context, x, y, width, height, radius) {
        var r = Math.min(radius, width / 2, height / 2);

        context.beginPath();
        context.moveTo(x + r, y);
        context.arcTo(x + width, y, x + width, y + height, r);
        context.arcTo(x + width, y + height, x, y + height, r);
        context.arcTo(x, y + height, x, y, r);
        context.arcTo(x, y, x + width, y, r);
        context.closePath();
    }

    function bookColor(book, index) {
        var palette = [
            ['#8b3a3a', '#33191d'],
            ['#4e5f7d', '#192433'],
            ['#6d4f82', '#251b31'],
            ['#4c6b4f', '#1c3022'],
            ['#956d2c', '#372817'],
            ['#7b495c', '#321b27'],
            ['#486b72', '#163139'],
            ['#7b6041', '#352819']
        ];

        var value = String(
            (book && (book.id || book.title)) || index
        );

        var hash = 0;

        for (var i = 0; i < value.length; i += 1) {
            hash = ((hash << 5) - hash) + value.charCodeAt(i);
            hash |= 0;
        }

        return palette[Math.abs(hash) % palette.length];
    }

    async function shareImage(blob, filename, title, text) {
        var reader = new FileReader();

        var dataUrl = await new Promise(function (resolve, reject) {
            reader.onloadend = function () {
                resolve(String(reader.result || ''));
            };

            reader.onerror = function () {
                reject(new Error('Could not encode the TBR image.'));
            };

            reader.readAsDataURL(blob);
        });

        var base64 = dataUrl.split(',')[1];

        if (!base64) {
            throw new Error('Could not encode the TBR image.');
        }

        var capacitor = window.Capacitor;
        var plugins = capacitor && capacitor.Plugins;
        var filesystem = plugins && plugins.Filesystem;
        var share = plugins && plugins.Share;
        var native = !!(
            capacitor &&
            typeof capacitor.isNativePlatform === 'function' &&
            capacitor.isNativePlatform()
        );

        if (
            native &&
            filesystem &&
            typeof filesystem.writeFile === 'function' &&
            typeof filesystem.getUri === 'function' &&
            share &&
            typeof share.share === 'function'
        ) {
            await filesystem.writeFile({
                path: filename,
                directory: 'CACHE',
                data: base64
            });

            var saved = await filesystem.getUri({
                path: filename,
                directory: 'CACHE'
            });

            await share.share({
                title: title,
                text: text,
                url: saved.uri,
                dialogTitle: 'Save or share TBR image'
            });

            return;
        }

        var url = URL.createObjectURL(blob);
        var link = document.createElement('a');

        link.href = url;
        link.download = filename;
        link.style.display = 'none';

        document.body.appendChild(link);
        link.click();
        link.remove();

        setTimeout(function () {
            URL.revokeObjectURL(url);
        }, 1500);
    }

    function loadLanternfallsLogo() {
        return new Promise(function (resolve) {
            var logo = new Image();

            logo.onload = function () {
                resolve(logo);
            };

            logo.onerror = function () {
                resolve(null);
            };

            logo.src = 'assets/lanternfalls-logo.png';
        });
    }

    async function exportTbrImage(button) {
        var month = currentMonthKey();
        var books = currentBooks();

        if (!books.length) {
            showToast("Add at least one book to this month's TBR first.");
            return;
        }

        if (button) {
            button.disabled = true;
            button.textContent = 'Preparing image…';
        }

        try {
            var logo = await loadLanternfallsLogo();
            var accent = currentAccent();
            var accentDark = darkenHex(accent, 0.58);
            var accentSoft = rgba(accent, 0.32);
            var accentGlow = rgba(accent, 0.52);
            var accentLine = rgba(accent, 0.76);
            var width = 1080;
            var padding = 54;
            var columns = 3;
            var gap = 24;
            var cardWidth = (width - padding * 2 - gap * 2) / columns;
            var cardHeight = 250;
            var rows = Math.ceil(books.length / columns);
            var headerHeight = 230;
            var footerHeight = 100;
            var height =
                padding +
                headerHeight +
                rows * cardHeight +
                Math.max(0, rows - 1) * gap +
                footerHeight;

            var canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            var context = canvas.getContext('2d');

            var background = context.createLinearGradient(0, 0, width, height);
            background.addColorStop(0, '#14181c');
            background.addColorStop(0.52, '#1b2129');
            background.addColorStop(1, '#172225');

            context.fillStyle = background;
            context.fillRect(0, 0, width, height);

            var glow = context.createRadialGradient(
                width - 125,
                84,
                10,
                width - 125,
                84,
                230
            );

            glow.addColorStop(0, accentGlow);
            glow.addColorStop(0.55, rgba(accent, 0.12));
            glow.addColorStop(1, rgba(accent, 0));

            context.fillStyle = glow;
            context.fillRect(0, 0, width, 270);

            context.fillStyle = accent;
            context.font = '700 19px Arial';
            context.fillText('LANTERNFALLS  •  THE HIDDEN ARCHIVE', padding, 68);

            context.fillStyle = '#fff6df';
            context.font = 'bold 54px Georgia';
            context.fillText(monthLabel(month), padding, 132);

            context.fillStyle = '#d4c8b0';
            context.font = '26px Arial';
            context.fillText(
                'Monthly TBR  •  ' +
                books.length +
                ' book' + (books.length === 1 ? '' : 's') +
                ' chosen',
                padding,
                174
            );

            if (logo) {
                context.drawImage(
                    logo,
                    width - 218,
                    16,
                    172,
                    148
                );
            } else {
                context.fillStyle = accent;
                context.font = '46px Georgia';
                context.textAlign = 'center';
                context.fillText('✦', width - 112, 96);
                context.textAlign = 'left';
            }

            books.forEach(function (book, index) {
                var row = Math.floor(index / columns);
                var column = index % columns;
                var x = padding + column * (cardWidth + gap);
                var y = padding + headerHeight + row * (cardHeight + gap);
                var colors = [
                    accent,
                    index % 2 === 0
                        ? accentDark
                        : darkenHex(accent, 0.42)
                ];
                var cardBackground = context.createLinearGradient(
                    x,
                    y,
                    x + cardWidth,
                    y + cardHeight
                );

                cardBackground.addColorStop(0, colors[0]);
                cardBackground.addColorStop(1, colors[1]);

                context.fillStyle = cardBackground;
                roundedRect(context, x, y, cardWidth, cardHeight, 10);
                context.fill();

                context.strokeStyle = accentLine;
                context.lineWidth = 1.4;
                roundedRect(context, x, y, cardWidth, cardHeight, 10);
                context.stroke();

                context.fillStyle = 'rgba(255,255,255,0.08)';

                for (var stripe = -cardHeight; stripe < cardWidth; stripe += 18) {
                    context.save();
                    context.translate(x, y);
                    context.rotate(-0.48);
                    context.fillRect(stripe, 0, 2, cardHeight * 2);
                    context.restore();
                }

                context.fillStyle = accent;
                context.font = '700 13px Arial';
                context.fillText(
                    String(index + 1).padStart(2, '0'),
                    x + 20,
                    y + 30
                );

                context.fillStyle = '#fff8e8';
                context.font = 'bold 25px Georgia';

                titleLines(
                    context,
                    book.title || 'Untitled',
                    cardWidth - 40,
                    3
                ).forEach(function (line, lineIndex) {
                    context.fillText(
                        line,
                        x + 20,
                        y + 82 + lineIndex * 31
                    );
                });

                context.fillStyle = '#ecd9be';
                context.font = 'italic 18px Georgia';

                titleLines(
                    context,
                    book.author || 'Unknown author',
                    cardWidth - 40,
                    2
                ).forEach(function (line, lineIndex) {
                    context.fillText(
                        line,
                        x + 20,
                        y + cardHeight - 44 + lineIndex * 18
                    );
                });
            });

            context.fillStyle = '#8a8378';
            context.font = '16px Arial';
            context.textAlign = 'center';
            context.fillText(
                'Generated by Lanternfalls: The Hidden Archive',
                width / 2,
                height - 28
            );
            context.textAlign = 'left';

            var blob = await new Promise(function (resolve, reject) {
                canvas.toBlob(function (result) {
                    if (result) {
                        resolve(result);
                    } else {
                        reject(new Error('Could not create the TBR image.'));
                    }
                }, 'image/png');
            });

            await shareImage(
                blob,
                'lanternfalls-tbr-' + month + '.png',
                monthLabel(month) + ' Monthly TBR',
                books.length + ' book' +
                (books.length === 1 ? '' : 's') +
                ' selected for ' + monthLabel(month)
            );

            showToast('TBR image ready to save or share.');
        } catch (error) {
            console.error('Monthly TBR export failed.', error);
            alert(
                'Could not create the TBR image.\n\n' +
                String((error && error.message) || error || 'Unknown error')
            );
        } finally {
            if (button) {
                button.disabled = false;
                button.textContent = 'Save or Share TBR Image';
            }
        }
    }

    function renderWindow() {
        var window = document.getElementById('monthlyTbrWindow');

        if (!window || window.classList.contains('hidden')) {
            return;
        }

        var month = currentMonthKey();
        var books = currentBooks();
        var heading = window.querySelector('.tbr-window-title');
        var subtitle = window.querySelector('.tbr-window-subtitle');
        var list = window.querySelector('.tbr-window-list');
        var exportButton = window.querySelector('.tbr-export');

        heading.textContent = 'Monthly TBR';
        subtitle.textContent =
            monthLabel(month) + ' · ' +
            books.length + ' selected';

        list.replaceChildren();

        if (!books.length) {
            var empty = document.createElement('p');

            empty.className = 'tbr-empty';
            empty.textContent =
                'Open a book’s detail page and choose “Add to ' +
                monthLabel(month) +
                ' TBR” to build this month’s list.';

            list.appendChild(empty);
        } else {
            books.forEach(function (book, index) {
                var row = document.createElement('article');
                row.className = 'tbr-book';

                var number = document.createElement('span');
                number.className = 'tbr-book-number';
                number.textContent = String(index + 1);

                var copy = document.createElement('div');
                copy.className = 'tbr-book-copy';

                var title = document.createElement('strong');
                title.textContent = book.title || 'Untitled';

                var author = document.createElement('span');
                author.textContent = book.author || 'Unknown author';

                copy.append(title, author);

                var remove = document.createElement('button');
                remove.type = 'button';
                remove.className = 'tbr-remove';
                remove.textContent = 'Remove';
                remove.setAttribute(
                    'aria-label',
                    'Remove ' + (book.title || 'book') + ' from monthly TBR'
                );

                remove.onclick = function () {
                    removeBook(book.id);
                };

                row.append(number, copy, remove);
                list.appendChild(row);
            });
        }

        exportButton.disabled = !books.length;
    }

    function openWindow() {
        var tbrWindow = document.getElementById('monthlyTbrWindow');

        if (!tbrWindow) {
            return;
        }

        /*
         * The Dashboard is also a full-screen fixed layer. Keep it visible
         * underneath, but bring the Monthly TBR window above it.
         */
        tbrWindow.classList.remove('hidden');
        tbrWindow.style.zIndex = '1300';

        renderWindow();

        requestAnimationFrame(function () {
            tbrWindow.scrollTop = 0;
        });
    }

    function attachDashboardCard() {
        var dashboard = document.getElementById('dashboard');

        if (!dashboard) {
            return;
        }

        var old = dashboard.querySelector('#monthlyTbrDashboardCard');

        if (old) {
            old.remove();
        }

        var books = currentBooks();
        var card = document.createElement('section');

        card.id = 'monthlyTbrDashboardCard';
        card.className = 'dash-card tbr-dashboard-card';

        card.innerHTML =
            '<div class="tbr-dashboard-copy">' +
            '<span>Monthly TBR</span>' +
            '<strong>' + monthLabel(currentMonthKey()) + '</strong>' +
            '<small>' +
            books.length + ' book' +
            (books.length === 1 ? '' : 's') +
            ' chosen for this month' +
            '</small>' +
            '</div>' +
            '<button type="button">Open TBR</button>';

        card.querySelector('button').onclick = openWindow;

        var calendar = dashboard.querySelector('#dashCalendarCard');
        var annual = Array.prototype.filter.call(
            dashboard.querySelectorAll('.dash-card'),
            function (item) {
                var heading = item.querySelector('h2');
                return heading &&
                    heading.textContent.trim() === 'Annual Statistics';
            }
        )[0];

        if (calendar && calendar.parentNode) {
            calendar.parentNode.insertBefore(card, calendar);
        } else if (annual && annual.parentNode) {
            annual.parentNode.insertBefore(card, annual);
        } else {
            var body = dashboard.querySelector('.dash-body');

            if (body) {
                body.appendChild(card);
            }
        }
    }

    function install() {
        var style = document.createElement('style');

        style.textContent =
            '.bd-tbr-button{display:block;width:100%;margin:16px 0 0;padding:13px;border:1px solid var(--gold,#A8823C);border-radius:10px;background:color-mix(in srgb,var(--gold,#A8823C) 14%,transparent);color:var(--gold,#A8823C);font:700 14px -apple-system,Segoe UI,sans-serif;cursor:pointer}' +
            '.bd-tbr-button.is-selected{border-color:#52d0b1;background:rgba(82,208,177,.12);color:#a8f3df}' +
            '.tbr-dashboard-card{display:flex;align-items:center;justify-content:space-between;gap:14px;background:linear-gradient(135deg,color-mix(in srgb,var(--accent,#8B3A3A) 42%,transparent),var(--bg-elevated,#1B2129))!important;border-color:color-mix(in srgb,var(--gold,#A8823C) 55%,transparent)!important}' +
            '.tbr-dashboard-copy{display:grid;gap:3px;min-width:0}' +
            '.tbr-dashboard-copy span{color:var(--gold,#A8823C);font-size:10px;font-weight:700;letter-spacing:.10em;text-transform:uppercase}' +
            '.tbr-dashboard-copy strong{color:#fff6df;font:21px Georgia,serif}' +
            '.tbr-dashboard-copy small{color:#d4c8b0;font-size:12px}' +
            '.tbr-dashboard-card button{flex:none;padding:10px 12px;border:1px solid var(--gold,#A8823C);border-radius:3px;background:transparent;color:#fff6df;font:inherit;cursor:pointer}' +
            '#monthlyTbrWindow{position:fixed;z-index:1300;inset:0;overflow:auto;background:var(--bg,#14181C);color:var(--paper-light,#F6F1E4)}' +
            '#monthlyTbrWindow.hidden{display:none!important}' +
            '.tbr-window-head{position:sticky;top:0;z-index:2;display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:12px;padding:18px 20px;background:var(--bg,#14181C);border-bottom:1px solid rgba(168,130,60,.25)}' +
            '.tbr-window-head h2{margin:0;font:24px Georgia,serif}' +
            '.tbr-window-head button{padding:8px 12px;border:1px solid var(--gold,#A8823C);border-radius:3px;background:transparent;color:var(--paper-light,#F6F1E4);font:inherit;cursor:pointer}' +
            '.tbr-window-head>span{width:55px}' +
            '.tbr-window-body{padding:18px 20px 130px}' +
            '.tbr-window-subtitle{margin:0 0 16px;color:var(--muted,#8A8378);font-size:13px}' +
            '.tbr-window-list{display:grid;gap:10px}' +
            '.tbr-book{display:flex;align-items:center;gap:12px;padding:14px;border:1px solid rgba(168,130,60,.28);border-radius:5px;background:var(--bg-elevated,#1B2129)}' +
            '.tbr-book-number{display:grid;place-items:center;width:32px;height:32px;flex:none;border:1px solid var(--gold,#A8823C);border-radius:50%;color:var(--gold,#A8823C);font:17px Georgia,serif}' +
            '.tbr-book-copy{min-width:0;flex:1}' +
            '.tbr-book-copy strong,.tbr-book-copy span{display:block}' +
            '.tbr-book-copy strong{overflow:hidden;color:var(--paper-light,#F6F1E4);font:17px Georgia,serif;text-overflow:ellipsis;white-space:nowrap}' +
            '.tbr-book-copy span{margin-top:4px;color:var(--muted,#8A8378);font-size:12px}' +
            '.tbr-remove{flex:none;padding:7px 9px;border:1px solid #bd7070;border-radius:3px;background:rgba(139,58,58,.16);color:#e3a0a0;font:12px inherit;cursor:pointer}' +
            '.tbr-empty{margin:0;padding:22px 0;color:var(--muted,#8A8378);font-size:13px;line-height:1.5}' +
            '.tbr-export{width:100%;margin-top:18px;padding:12px;border:1px solid var(--gold,#A8823C);border-radius:3px;background:var(--accent,#8B3A3A);color:var(--paper-light,#F6F1E4);font:700 14px inherit;cursor:pointer}' +
            '.tbr-export:disabled{opacity:.5;cursor:not-allowed}';

        document.head.appendChild(style);

        var window = document.createElement('section');

        window.id = 'monthlyTbrWindow';
        window.className = 'hidden';
        window.setAttribute('aria-label', 'Monthly TBR');

        window.innerHTML =
            '<header class="tbr-window-head">' +
            '<button type="button" class="tbr-back">‹ Back</button>' +
            '<h2 class="tbr-window-title">Monthly TBR</h2>' +
            '<span></span>' +
            '</header>' +
            '<main class="tbr-window-body">' +
            '<p class="tbr-window-subtitle"></p>' +
            '<div class="tbr-window-list"></div>' +
            '<button type="button" class="tbr-export">Save or Share TBR Image</button>' +
            '</main>';

        document.body.appendChild(window);



        window.querySelector('.tbr-back').onclick = closeTbrWindow;

        window.querySelector('.tbr-export').onclick = function () {
            exportTbrImage(this);
        };

        window.addEventListener('click', function (event) {
            if (event.target === window) {
                closeTbrWindow();
            }
        });

        new MutationObserver(function () {
            setTimeout(attachDashboardCard, 0);
        }).observe(document.body, {
            childList: true,
            subtree: true
        });

        window.addEventListener(
  'lanternfalls-monthly-tbr-changed',
  sync
);

        window.addEventListener(
            'bookshelf-books-changed',
            function () {
                attachDashboardCard();
                renderWindow();
            }
        );

        window.addEventListener(
            'bookshelf-appearance-changed',
            function () {
                attachDashboardCard();
                renderWindow();
            }
        );

        window.addEventListener('bookshelf-navigation-changed', function (event) {
            if (!event.detail || event.detail.page !== 'library') {
                return;
            }

            var tbrWindow = document.getElementById('monthlyTbrWindow');

            if (tbrWindow) {
                tbrWindow.classList.add('hidden');
            }

            var bookDetails = document.getElementById('bookDetails');

            if (bookDetails) {
                bookDetails.classList.add('hidden');
            }
        });

        attachDashboardCard();
    }

    window.LanternfallsMonthlyTbr = {
        toggleBook: toggleBook,
        isInCurrentMonth: isInCurrentMonth,
        open: openWindow,
        currentBooks: currentBooks
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', install);
    } else {
        install();
    }
})();