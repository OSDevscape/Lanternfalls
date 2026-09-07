(function () {
    var LOG_KEY = 'bookshelf-reading-log-v1';
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
        var settings;

        try {
            settings = JSON.parse(
                localStorage.getItem(APPEARANCE_KEY) ||
                '{"mode":"dark","accent":"red"}'
            );
        } catch (_) {
            settings = { accent: 'red' };
        }

        return ACCENT_COLORS[settings.accent] || ACCENT_COLORS.red;
    }

    function hexToRgb(hex) {
        var value = String(hex || '').replace('#', '');

        if (value.length === 3) {
            value =
                value.charAt(0) + value.charAt(0) +
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
    var BOOKS_KEY = 'bookshelf-data';

    var MONTH_NAMES = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    var WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    function readData(key, fallback) {
        try {
            return JSON.parse(localStorage.getItem(key) || fallback);
        } catch (_) {
            return JSON.parse(fallback);
        }
    }

    function readLog() {
        return readData(LOG_KEY, '[]');
    }

    function readBooks() {
        return readData(BOOKS_KEY, '{"books":[]}').books || [];
    }

    function pad(value) {
        return String(value).padStart(2, '0');
    }

    function dateKey(value) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) {
            return String(value);
        }

        var date = new Date(value || 0);

        if (isNaN(date.getTime())) {
            return '';
        }

        return date.getFullYear() + '-' +
            pad(date.getMonth() + 1) + '-' +
            pad(date.getDate());
    }

    function todayKey() {
        var now = new Date();

        return now.getFullYear() + '-' +
            pad(now.getMonth() + 1) + '-' +
            pad(now.getDate());
    }

    function monthKey(year, month) {
        return year + '-' + pad(month + 1);
    }

    function coverUrl(book) {
        var explicit = String((book && book.coverUrl) || '')
            .replace(/^http:\/\//i, 'https://');

        if (explicit) {
            return explicit;
        }

        var isbn = String((book && book.isbn) || '')
            .replace(/[^0-9Xx]/g, '');

        return isbn
            ? 'https://covers.openlibrary.org/b/isbn/' +
            encodeURIComponent(isbn) +
            '-M.jpg?default=false'
            : '';
    }

    function attachBookCover(image, book) {
        image.alt = '';
        image.loading = 'lazy';

        image.onerror = function () {
            image.style.visibility = 'hidden';
        };

        var url = coverUrl(book);

        if (!url) {
            image.style.visibility = 'hidden';
            return;
        }

        if (
            !book.coverUrl &&
            window.BookCoverCache &&
            typeof window.BookCoverCache.attach === 'function'
        ) {
            window.BookCoverCache.attach(image, String(book.isbn || ''));
            return;
        }

        image.src = url;
    }

    function findBook(bookId) {
        return readBooks().filter(function (book) {
            return book && book.id === bookId;
        })[0] || null;
    }

    function monthActivity(year, month) {
        var prefix = monthKey(year, month) + '-';
        var days = {};

        readLog().forEach(function (entry) {
            var minutes = Math.max(0, Number((entry || {}).minutes) || 0);
            var day = dateKey(
                entry && (entry.date || entry.createdAt || entry.endedAt)
            );

            if (!minutes || day.indexOf(prefix) !== 0) {
                return;
            }

            if (!days[day]) {
                days[day] = {
                    minutes: 0,
                    sessions: 0,
                    books: {}
                };
            }

            days[day].minutes += minutes;
            days[day].sessions += 1;

            if (entry.bookId) {
                days[day].books[entry.bookId] =
                    (days[day].books[entry.bookId] || 0) + minutes;
            }
        });

        Object.keys(days).forEach(function (day) {
            var activity = days[day];

            activity.bookList = Object.keys(activity.books)
                .map(function (bookId) {
                    var book = findBook(bookId);

                    return book
                        ? {
                            book: book,
                            minutes: activity.books[bookId]
                        }
                        : null;
                })
                .filter(Boolean)
                .sort(function (a, b) {
                    return b.minutes - a.minutes;
                });
        });

        return days;
    }

    function removeDetail() {
        var existing = document.getElementById('dashCalendarBookDetail');

        if (existing) {
            existing.remove();
        }
    }

    function openBookDetail(book, minutes, day) {
        removeDetail();

        var modal = document.createElement('section');
        modal.id = 'dashCalendarBookDetail';
        modal.className = 'dash-calendar-detail';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-label', 'Reading details for ' + (book.title || 'book'));

        var sheet = document.createElement('div');
        sheet.className = 'dash-calendar-detail-sheet';

        var close = document.createElement('button');
        close.type = 'button';
        close.className = 'dash-calendar-detail-close';
        close.setAttribute('aria-label', 'Close book details');
        close.textContent = '×';

        var cover = document.createElement('img');
        cover.className = 'dash-calendar-detail-cover';
        cover.alt = 'Cover of ' + (book.title || 'book');
        attachBookCover(cover, book);

        var copy = document.createElement('div');
        copy.className = 'dash-calendar-detail-copy';

        var label = document.createElement('span');
        label.className = 'dash-calendar-detail-label';
        label.textContent = 'Reading Log';

        var title = document.createElement('h2');
        title.textContent = book.title || 'Untitled';

        var author = document.createElement('p');
        author.className = 'dash-calendar-detail-author';
        author.textContent = book.author || 'Unknown author';

        var activity = document.createElement('p');
        activity.className = 'dash-calendar-detail-activity';
        activity.textContent =
            minutes + ' minute' + (minutes === 1 ? '' : 's') +
            ' logged on ' + day + '.';

        var metaParts = [
            book.genre,
            book.format,
            book.status ? String(book.status).replace(/-/g, ' ') : ''
        ].filter(Boolean);

        if (metaParts.length) {
            var meta = document.createElement('p');
            meta.className = 'dash-calendar-detail-meta';
            meta.textContent = metaParts.join(' · ');
            copy.appendChild(meta);
        }

        copy.append(label, title, author, activity);

        var openLibrary = document.createElement('button');
        openLibrary.type = 'button';
        openLibrary.className = 'dash-calendar-detail-library';
        openLibrary.textContent = 'Open Book Details';

        openLibrary.onclick = function () {
            removeDetail();

            var dashboard = document.getElementById('dashboard');

            if (dashboard) {
                dashboard.classList.add('hidden');
            }

            var card = Array.prototype.filter.call(
                document.querySelectorAll('#bookList .book-card'),
                function (item) {
                    return item.dataset.bookId === book.id;
                }
            )[0];

            if (card) {
                card.click();
            }
        };

        close.onclick = removeDetail;

        modal.onclick = function (event) {
            if (event.target === modal) {
                removeDetail();
            }
        };

        sheet.append(close, cover, copy, openLibrary);
        modal.appendChild(sheet);
        document.body.appendChild(modal);

        close.focus();
    }

    function loadImage(url) {
        return new Promise(function (resolve) {
            if (!url) {
                resolve(null);
                return;
            }

            var image = new Image();
            image.crossOrigin = 'anonymous';

            image.onload = function () {
                resolve(image);
            };

            image.onerror = function () {
                resolve(null);
            };

            image.src = url;
        });
    }

    function coverForExport(book) {
        var explicit = String((book && book.coverUrl) || '')
            .replace(/^http:\/\//i, 'https://');

        if (explicit) {
            return explicit;
        }

        var isbn = String((book && book.isbn) || '')
            .replace(/[^0-9Xx]/g, '');

        return isbn
            ? 'https://covers.openlibrary.org/b/isbn/' +
            encodeURIComponent(isbn) +
            '-M.jpg?default=false'
            : '';
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

    function drawCover(context, image, x, y, width, height) {
        if (!image) {
            return;
        }

        var sourceRatio = image.width / image.height;
        var targetRatio = width / height;
        var sourceX = 0;
        var sourceY = 0;
        var sourceWidth = image.width;
        var sourceHeight = image.height;

        if (sourceRatio > targetRatio) {
            sourceWidth = image.height * targetRatio;
            sourceX = (image.width - sourceWidth) / 2;
        } else {
            sourceHeight = image.width / targetRatio;
            sourceY = (image.height - sourceHeight) / 2;
        }

        context.save();
        roundedRect(context, x, y, width, height, 5);
        context.clip();
        context.drawImage(
            image,
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            x,
            y,
            width,
            height
        );
        context.restore();
    }

    function loadExportImage(url) {
        return new Promise(function (resolve) {
            if (!url) {
                resolve(null);
                return;
            }

            var image = new Image();

            image.onload = function () {
                resolve(image);
            };

            image.onerror = function () {
                resolve(null);
            };

            image.src = url;
        });
    }

    async function exportCoverUrl(book) {
        var explicit = String((book && book.coverUrl) || '')
            .replace(/^http:\/\//i, 'https://');

        if (explicit) {
            return explicit;
        }

        var isbn = String((book && book.isbn) || '')
            .replace(/[^0-9Xx]/g, '');

        if (
            isbn &&
            window.BookCoverCache &&
            typeof window.BookCoverCache.cachedUrl === 'function'
        ) {
            var cached = await window.BookCoverCache.cachedUrl(isbn);

            if (cached) {
                return cached;
            }
        }

        return isbn
            ? 'https://covers.openlibrary.org/b/isbn/' +
            encodeURIComponent(isbn) +
            '-M.jpg?default=false'
            : '';
    }

    function drawExportCover(context, image, x, y, width, height) {
        if (!image) {
            return false;
        }

        var sourceWidth = image.naturalWidth || image.width;
        var sourceHeight = image.naturalHeight || image.height;

        if (!sourceWidth || !sourceHeight) {
            return false;
        }

        var sourceRatio = sourceWidth / sourceHeight;
        var targetRatio = width / height;
        var sx = 0;
        var sy = 0;
        var sw = sourceWidth;
        var sh = sourceHeight;

        if (sourceRatio > targetRatio) {
            sw = sourceHeight * targetRatio;
            sx = (sourceWidth - sw) / 2;
        } else {
            sh = sourceWidth / targetRatio;
            sy = (sourceHeight - sh) / 2;
        }

        context.save();
        roundedRect(context, x, y, width, height, 4);
        context.clip();

        context.drawImage(
            image,
            sx,
            sy,
            sw,
            sh,
            x,
            y,
            width,
            height
        );

        context.restore();

        context.strokeStyle = 'rgba(255,246,223,0.85)';
        context.lineWidth = 1;
        roundedRect(context, x, y, width, height, 4);
        context.stroke();

        return true;
    }

    function splitCalendarTitle(title, maximumCharacters, maximumLines) {
        var words = String(title || 'Untitled').trim().split(/\s+/);
        var lines = [];
        var line = '';

        words.forEach(function (word) {
            var candidate = line ? line + ' ' + word : word;

            if (
                candidate.length <= maximumCharacters ||
                !line
            ) {
                line = candidate;
                return;
            }

            lines.push(line);
            line = word;
        });

        if (line && lines.length < maximumLines) {
            lines.push(line);
        }

        if (lines.length > maximumLines) {
            lines = lines.slice(0, maximumLines);
        }

        if (
            words.join(' ').length >
            lines.join(' ').length
        ) {
            var last = lines.length - 1;
            lines[last] = lines[last].slice(0, maximumCharacters - 1) + '…';
        }

        return lines;
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

    async function exportCalendarImage(year, month, days, button) {
        if (button) {
            button.disabled = true;
            button.textContent = 'Preparing image…';
        }

        function resetButton() {
            if (button) {
                button.disabled = false;
                button.textContent = 'Download Calendar Image';
            }
        }

        try {
            var logo = await loadLanternfallsLogo();
            var accent = currentAccent();
            var accentGlow = rgba(accent, 0.48);
            var accentSoft = rgba(accent, 0.12);
            var accentMedium = rgba(accent, 0.52);
            var accentLine = rgba(accent, 0.76);
            var width = 1080;
            var padding = 48;
            var gridWidth = width - padding * 2;
            var gap = 8;
            var cellWidth = (gridWidth - gap * 6) / 7;
            var firstDay = new Date(year, month, 1).getDay();
            var daysInMonth = new Date(year, month + 1, 0).getDate();
            var weeks = Math.ceil((firstDay + daysInMonth) / 7);
            var headerHeight = 190;
            var weekdayHeight = 40;
            var cellHeight = 108;
            var statsHeight = 116;
            var footerHeight = 72;
            var height =
                padding +
                headerHeight +
                weekdayHeight +
                weeks * cellHeight +
                (weeks - 1) * gap +
                statsHeight +
                footerHeight;

            var canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            var context = canvas.getContext('2d');

            var activeDays = Object.keys(days);
            var totalMinutes = activeDays.reduce(function (sum, day) {
                return sum + days[day].minutes;
            }, 0);

            var totalSessions = activeDays.reduce(function (sum, day) {
                return sum + days[day].sessions;
            }, 0);

            var maxMinutes = Math.max.apply(
                null,
                activeDays.map(function (day) {
                    return days[day].minutes;
                }).concat([1])
            );

            var background = context.createLinearGradient(0, 0, width, height);
            background.addColorStop(0, '#14181c');
            background.addColorStop(0.56, '#1b2129');
            background.addColorStop(1, '#172225');
            context.fillStyle = background;
            context.fillRect(0, 0, width, height);

            var glow = context.createRadialGradient(
                width - 125,
                82,
                10,
                width - 125,
                82,
                215
            );
            glow.addColorStop(0, accentGlow);
            glow.addColorStop(0.56, accentSoft);
            glow.addColorStop(1, rgba(accent, 0));

            context.fillStyle = accent;
            context.font = '700 19px Arial';
            context.fillText('LANTERNFALLS  •  READING CHRONICLE', padding, 64);

            context.fillStyle = '#fff6df';
            context.font = 'bold 48px Georgia';
            context.fillText(MONTH_NAMES[month] + ' ' + year, padding, 126);

            context.fillStyle = '#d4c8b0';
            context.font = '24px Arial';
            context.fillText(
                totalMinutes
                    ? totalMinutes + ' minutes of reading recorded this month'
                    : 'Your next reading session will illuminate the archive.',
                padding,
                166
            );

            if (logo) {
                context.drawImage(
                    logo,
                    width - 190,
                    18,
                    144,
                    124
                );
            } else {
                context.fillStyle = '#ffe2a2';
                context.font = '42px Georgia';
                context.textAlign = 'center';
                context.fillText('✦', width - 104, 92);
                context.textAlign = 'left';
            }

            var weekdaysTop = padding + headerHeight;

            WEEKDAYS.forEach(function (weekday, index) {
                var x = padding + index * (cellWidth + gap);

                context.fillStyle = '#a89f91';
                context.font = '700 16px Arial';
                context.textAlign = 'center';
                context.fillText(weekday.toUpperCase(), x + cellWidth / 2, weekdaysTop);
            });

            context.textAlign = 'left';

            var cellsTop = weekdaysTop + weekdayHeight;
            var today = todayKey();

            for (var number = 1; number <= daysInMonth; number += 1) {
                var calendarIndex = firstDay + number - 1;
                var row = Math.floor(calendarIndex / 7);
                var column = calendarIndex % 7;
                var x = padding + column * (cellWidth + gap);
                var y = cellsTop + row * (cellHeight + gap);
                var day = monthKey(year, month) + '-' + pad(number);
                var activity = days[day];

                context.fillStyle = activity
                    ? rgba(
                        accent,
                        Math.max(
                            0.28,
                            Math.min(0.82, activity.minutes / maxMinutes * 0.82)
                        )
                    )
                    : 'rgba(0,0,0,0.18)';

                roundedRect(context, x, y, cellWidth, cellHeight, 6);
                context.fill();

                context.strokeStyle = day === today
                    ? accent
                    : activity
                        ? rgba(accent, 0.78)
                        : rgba(accent, 0.18);

                context.lineWidth = day === today ? 3 : 1;
                roundedRect(context, x, y, cellWidth, cellHeight, 6);
                context.stroke();

                context.fillStyle = '#fff6df';
                context.font = '700 18px Arial';
                context.textAlign = 'right';
                context.fillText(String(number), x + cellWidth - 9, y + 23);
                context.textAlign = 'left';

                if (activity && activity.bookList && activity.bookList.length) {
                    var primaryBook = activity.bookList[0].book || {};
                    var primaryTitle = String(primaryBook.title || 'Untitled');
                    var extraBooks = activity.bookList.length - 1;
                    var titleLines = splitCalendarTitle(primaryTitle, 21, 2);
                    var titleBoxX = x + 8;
                    var titleBoxY = y + 32;
                    var titleBoxWidth = cellWidth - 16;
                    var titleBoxHeight = extraBooks ? 46 : 54;

                    context.fillStyle = 'rgba(20,24,28,0.78)';
                    roundedRect(
                        context,
                        titleBoxX,
                        titleBoxY,
                        titleBoxWidth,
                        titleBoxHeight,
                        5
                    );
                    context.fill();

                    context.strokeStyle = 'rgba(255,246,223,0.48)';
                    context.lineWidth = 1;
                    roundedRect(
                        context,
                        titleBoxX,
                        titleBoxY,
                        titleBoxWidth,
                        titleBoxHeight,
                        5
                    );
                    context.stroke();

                    context.fillStyle = '#fff6df';
                    context.font = '700 11px Arial';
                    context.textAlign = 'center';

                    titleLines.forEach(function (line, index) {
                        context.fillText(
                            line,
                            x + cellWidth / 2,
                            titleBoxY + 19 + index * 15
                        );
                    });

                    if (extraBooks > 0) {
                        context.fillStyle = accent;
                        context.font = '700 10px Arial';
                        context.fillText(
                            '+' + extraBooks + ' more book' + (extraBooks === 1 ? '' : 's'),
                            x + cellWidth / 2,
                            y + 94
                        );
                    }

                    context.textAlign = 'left';

                    if (activity) {
                        var minutesLabel = activity.minutes + ' MIN';
                        var badgeWidth = 62;
                        var badgeHeight = 20;
                        var badgeX = x + (cellWidth - badgeWidth) / 2;
                        var badgeY = y + cellHeight - 25;

                        context.fillStyle = 'rgba(20,24,28,0.78)';
                        roundedRect(
                            context,
                            badgeX,
                            badgeY,
                            badgeWidth,
                            badgeHeight,
                            10
                        );
                        context.fill();

                        context.strokeStyle = rgba(accent, 0.78);
                        context.lineWidth = 1;
                        roundedRect(
                            context,
                            badgeX,
                            badgeY,
                            badgeWidth,
                            badgeHeight,
                            10
                        );
                        context.stroke();

                        context.fillStyle = '#fff0c4';
                        context.font = '700 10px Arial';
                        context.textAlign = 'center';
                        context.fillText(
                            minutesLabel,
                            x + cellWidth / 2,
                            badgeY + 14
                        );
                        context.textAlign = 'left';
                    }
                }
            }

            var statsTop =
                cellsTop +
                weeks * cellHeight +
                (weeks - 1) * gap +
                28;

            var statGap = 8;
            var statWidth = (gridWidth - statGap * 2) / 3;

            [
                { value: totalMinutes, label: 'MINUTES' },
                { value: activeDays.length, label: 'ACTIVE DAYS' },
                { value: totalSessions, label: 'SESSIONS' }
            ].forEach(function (stat, index) {
                var x = padding + index * (statWidth + statGap);

                context.fillStyle = 'rgba(0,0,0,0.20)';
                roundedRect(context, x, statsTop, statWidth, 78, 6);
                context.fill();

                context.strokeStyle = rgba(accent, 0.30);
                context.lineWidth = 1;
                roundedRect(context, x, statsTop, statWidth, 78, 6);
                context.stroke();

                context.fillStyle = '#dfc17d';
                context.font = 'bold 30px Georgia';
                context.textAlign = 'center';
                context.fillText(String(stat.value), x + statWidth / 2, statsTop + 37);

                context.fillStyle = '#a89f91';
                context.font = '700 11px Arial';
                context.fillText(stat.label, x + statWidth / 2, statsTop + 61);
            });

            context.textAlign = 'center';
            context.fillStyle = '#8a8378';
            context.font = '16px Arial';
            context.fillText(
                'Generated by Lanternfalls: The Hidden Archive',
                width / 2,
                height - 24
            );
            context.textAlign = 'left';

            var blob = await new Promise(function (resolve, reject) {
                canvas.toBlob(function (result) {
                    if (result) {
                        resolve(result);
                    } else {
                        reject(new Error('Could not create calendar image.'));
                    }
                }, 'image/png');
            });

            var filename =
                'lanternfalls-reading-calendar-' +
                year + '-' + pad(month + 1) + '.png';

            var dataUrl = await new Promise(function (resolve, reject) {
                var reader = new FileReader();

                reader.onloadend = function () {
                    resolve(String(reader.result || ''));
                };

                reader.onerror = function () {
                    reject(new Error('Could not encode calendar image.'));
                };

                reader.readAsDataURL(blob);
            });

            var base64 = dataUrl.split(',')[1];

            if (!base64) {
                throw new Error('Could not encode calendar image.');
            }

            var capacitor = window.Capacitor;
            var plugins = capacitor && capacitor.Plugins;
            var filesystem = plugins && plugins.Filesystem;
            var share = plugins && plugins.Share;
            var isNative = !!(
                capacitor &&
                typeof capacitor.isNativePlatform === 'function' &&
                capacitor.isNativePlatform()
            );

            if (isNative && filesystem && typeof filesystem.writeFile === 'function') {
                await filesystem.writeFile({
                    path: filename,
                    directory: 'CACHE',
                    data: base64
                });

                var uri;

                if (typeof filesystem.getUri === 'function') {
                    var result = await filesystem.getUri({
                        path: filename,
                        directory: 'CACHE'
                    });

                    uri = result.uri;
                }

                if (share && typeof share.share === 'function' && uri) {
                    await share.share({
                        title: 'Lanternfalls Reading Calendar',
                        text: MONTH_NAMES[month] + ' ' + year + ' reading calendar',
                        url: uri,
                        dialogTitle: 'Save or share calendar image'
                    });
                } else {
                    alert(
                        'Calendar image saved in the app cache as ' + filename +
                        '. Sharing is not available in this build.'
                    );
                }

                resetButton();
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

            window.setTimeout(function () {
                URL.revokeObjectURL(url);
            }, 1500);

            resetButton();
        } catch (error) {
            console.error('Calendar image export failed.', error);

            if (button) {
                button.disabled = false;
                button.textContent = 'Download Calendar Image';
            }

            alert(
                'Could not create the calendar image.\n\n' +
                String((error && error.message) || error || 'Unknown error')
            );
        }
    }

    function activeDashboard() {
        return document.getElementById('dashboard');
    }

    function existingCalendar(dashboard) {
        return dashboard.querySelector('#dashCalendarCard');
    }

    function calendarCard() {
        var card = document.createElement('details');

        card.id = 'dashCalendarCard';
        card.className = 'dash-card dash-calendar-card';
        card.open = false;

        card.innerHTML =
            '<summary class="dash-calendar-summary">' +
            '<span class="dash-calendar-summary-copy">' +
            '<span class="dash-calendar-kicker">Reading Chronicle</span>' +
            '<strong>Calendar</strong>' +
            '<small>Tap to reveal this month’s reading activity</small>' +
            '</span>' +
            '<span class="dash-calendar-chevron" aria-hidden="true">⌄</span>' +
            '</summary>' +
            '<div class="dash-calendar-body"></div>';

        return card;
    }

    function renderImageCard(year, month, days) {
        var activeDays = Object.keys(days);
        var totalMinutes = activeDays.reduce(function (sum, day) {
            return sum + days[day].minutes;
        }, 0);

        var image = document.createElement('section');
        image.className = 'dash-calendar-image-card';

        image.innerHTML =
            '<div class="dash-calendar-image-glow" aria-hidden="true"></div>' +
            '<div class="dash-calendar-image-copy">' +
            '<span>Reading Chronicle</span>' +
            '<strong>' + MONTH_NAMES[month] + ' ' + year + '</strong>' +
            '<small>' +
            (totalMinutes
                ? totalMinutes + ' minutes across ' + activeDays.length +
                ' active day' + (activeDays.length === 1 ? '' : 's')
                : 'Your next reading session will illuminate the archive.') +
            '</small>' +
            '</div>';
        return image;
    }

    function renderBookCovers(activity, day) {
        var covers = document.createElement('div');
        covers.className = 'dash-calendar-day-covers';

        var visible = activity.bookList.slice(0, 2);

        visible.forEach(function (item) {
            var button = document.createElement('button');
            button.type = 'button';
            button.className = 'dash-calendar-cover-button';
            button.setAttribute(
                'aria-label',
                'Open reading details for ' + (item.book.title || 'book')
            );
            button.title =
                (item.book.title || 'Untitled') + ' · ' +
                item.minutes + ' reading minutes';

            var image = document.createElement('img');
            image.className = 'dash-calendar-cover';
            image.alt = '';
            attachBookCover(image, item.book);

            button.onclick = function (event) {
                event.preventDefault();
                event.stopPropagation();
                openBookDetail(item.book, item.minutes, day);
            };

            button.appendChild(image);
            covers.appendChild(button);
        });

        if (activity.bookList.length > 2) {
            var more = document.createElement('span');
            more.className = 'dash-calendar-more-covers';
            more.textContent = '+' + (activity.bookList.length - 2);
            more.title =
                activity.bookList.length + ' books logged on ' + day;
            covers.appendChild(more);
        }

        return covers;
    }

    function renderCalendarGrid(year, month, days) {
        var grid = document.createElement('div');
        grid.className = 'dash-calendar-grid';

        WEEKDAYS.forEach(function (label) {
            var weekday = document.createElement('span');
            weekday.className = 'dash-calendar-weekday';
            weekday.textContent = label;
            grid.appendChild(weekday);
        });

        var firstDay = new Date(year, month, 1).getDay();
        var daysInMonth = new Date(year, month + 1, 0).getDate();
        var maxMinutes = Math.max.apply(
            null,
            Object.keys(days).map(function (key) {
                return days[key].minutes;
            }).concat([1])
        );
        var today = todayKey();

        for (var blank = 0; blank < firstDay; blank += 1) {
            var spacer = document.createElement('span');
            spacer.className = 'dash-calendar-blank';
            spacer.setAttribute('aria-hidden', 'true');
            grid.appendChild(spacer);
        }

        for (var number = 1; number <= daysInMonth; number += 1) {
            var day = monthKey(year, month) + '-' + pad(number);
            var activity = days[day];
            var cell = document.createElement('div');

            cell.className = 'dash-calendar-day';

            if (day === today) {
                cell.classList.add('is-today');
            }

            if (activity) {
                var level = Math.max(
                    1,
                    Math.min(4, Math.ceil(activity.minutes / maxMinutes * 4))
                );

                cell.classList.add('is-active', 'activity-' + level);
            }

            var numberLabel = document.createElement('span');
            numberLabel.className = 'dash-calendar-day-number';
            numberLabel.textContent = number;
            cell.appendChild(numberLabel);

            if (activity && activity.bookList.length) {
                cell.appendChild(renderBookCovers(activity, day));
            } else if (activity) {
                var minutes = document.createElement('small');
                minutes.className = 'dash-calendar-minutes';
                minutes.textContent = activity.minutes + 'm';
                cell.appendChild(minutes);
            }

            if (activity) {
                cell.title =
                    activity.minutes + ' reading minutes · ' +
                    activity.sessions + ' session' +
                    (activity.sessions === 1 ? '' : 's');
            } else {
                cell.title = 'No reading logged';
            }

            grid.appendChild(cell);
        }

        return grid;
    }

    function renderContent(card) {
        var body = card.querySelector('.dash-calendar-body');

        if (!body) {
            return;
        }

        var now = new Date();
        var year = now.getFullYear();
        var month = now.getMonth();
        var days = monthActivity(year, month);
        var activeDays = Object.keys(days).length;
        var totalMinutes = Object.keys(days).reduce(function (sum, day) {
            return sum + days[day].minutes;
        }, 0);
        var totalSessions = Object.keys(days).reduce(function (sum, day) {
            return sum + days[day].sessions;
        }, 0);

        body.innerHTML = '';
        body.appendChild(renderImageCard(year, month, days));

        var heading = document.createElement('div');
        heading.className = 'dash-calendar-month-heading';
        heading.innerHTML =
            '<div><span>This month</span><strong>' +
            MONTH_NAMES[month] + ' ' + year +
            '</strong></div>' +
            '<span class="dash-calendar-legend"><i></i> Reading logged</span>';

        body.appendChild(heading);
        body.appendChild(renderCalendarGrid(year, month, days));

        var stats = document.createElement('div');
        stats.className = 'dash-calendar-stats';
        stats.innerHTML =
            '<div><strong>' + totalMinutes + '</strong><span>minutes</span></div>' +
            '<div><strong>' + activeDays + '</strong><span>active days</span></div>' +
            '<div><strong>' + totalSessions + '</strong><span>sessions</span></div>';

        body.appendChild(stats);

        var exportButton = document.createElement('button');
        exportButton.type = 'button';
        exportButton.className = 'dash-calendar-export';
        exportButton.textContent = 'Download Calendar Image';
        exportButton.onclick = function () {
            exportCalendarImage(year, month, days, exportButton);
        };

        body.appendChild(exportButton);

        var note = document.createElement('p');
        note.className = 'dash-calendar-note';
        note.textContent = activeDays
            ? 'Tap a book cover to see that day’s reading details.'
            : 'Log reading time with a selected book to place its cover on the calendar.';
        body.appendChild(note);
    }

    function findAnnualCard(dashboard) {
        return Array.prototype.filter.call(
            dashboard.querySelectorAll('.dash-card'),
            function (card) {
                var title = card.querySelector('h2');
                return title && title.textContent.trim() === 'Annual Statistics';
            }
        )[0] || null;
    }

    function insertCalendar() {
        var dashboard = activeDashboard();

        if (!dashboard) {
            return;
        }

        var calendar = existingCalendar(dashboard);

        if (!calendar) {
            calendar = calendarCard();

            var annual = findAnnualCard(dashboard);

            if (annual && annual.parentNode) {
                annual.parentNode.insertBefore(calendar, annual);
            } else {
                var body = dashboard.querySelector('.dash-body');

                if (body) {
                    body.appendChild(calendar);
                }
            }
        }

        var wasOpen = calendar.open;

        renderContent(calendar);

        calendar.open = wasOpen;
    }

    function install() {
        var dashboard = activeDashboard();

        if (!dashboard || dashboard.dataset.calendarReady) {
            return;
        }

        dashboard.dataset.calendarReady = 'true';

        var style = document.createElement('style');

        style.textContent =
            '.dash-calendar-card{padding:0;overflow:hidden}' +
            '.dash-calendar-summary{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px;cursor:pointer;list-style:none}' +
            '.dash-calendar-summary::-webkit-details-marker{display:none}' +
            '.dash-calendar-summary-copy{display:grid;gap:3px}' +
            '.dash-calendar-summary-copy strong{font:20px Georgia,serif;color:var(--paper-light,#F6F1E4)}' +
            '.dash-calendar-summary-copy small{color:var(--muted,#8A8378);font-size:12px}' +
            '.dash-calendar-kicker{color:var(--gold,#A8823C);font-size:10px;font-weight:700;letter-spacing:.11em;text-transform:uppercase}' +
            '.dash-calendar-chevron{color:var(--gold,#A8823C);font-size:25px;line-height:1;transition:transform .2s ease}' +
            '.dash-calendar-card[open] .dash-calendar-chevron{transform:rotate(180deg)}' +
            '.dash-calendar-body{padding:0 16px 16px;border-top:1px solid rgba(168,130,60,.22)}' +
            '.dash-calendar-image-card{position:relative;isolation:isolate;display:flex;align-items:center;justify-content:space-between;min-height:112px;margin:16px 0;padding:18px;overflow:hidden;border:1px solid color-mix(in srgb,var(--accent,#8B3A3A) 60%,transparent);border-radius:5px;background:linear-gradient(135deg,color-mix(in srgb,var(--accent,#8B3A3A) 35%,#14181C) 0%,var(--bg-elevated,#1B2129) 52%,#182427 100%)}' +
            '.dash-calendar-image-card:before{content:"";position:absolute;z-index:-1;inset:0;background:repeating-linear-gradient(135deg,rgba(255,255,255,.025) 0 1px,transparent 1px 7px)}' +
            '.dash-calendar-image-glow{position:absolute;z-index:-1;right:-26px;top:-42px;width:145px;height:145px;border-radius:50%;background:radial-gradient(circle,color-mix(in srgb,var(--accent,#8B3A3A) 58%,transparent),color-mix(in srgb,var(--accent,#8B3A3A) 10%,transparent) 52%,transparent 70%)}' +
            '.dash-calendar-image-copy{display:grid;gap:5px;max-width:78%}' +
            '.dash-calendar-image-copy span{color:var(--gold,#A8823C);font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase}' +
            '.dash-calendar-image-copy strong{font:24px Georgia,serif;color:#fff6df;line-height:1.05}' +
            '.dash-calendar-image-copy small{color:#d4c8b0;font-size:12px;line-height:1.35}' +
            '.dash-calendar-month-heading{display:flex;align-items:end;justify-content:space-between;gap:12px;margin:2px 0 12px}' +
            '.dash-calendar-month-heading div{display:grid;gap:2px}' +
            '.dash-calendar-month-heading span{color:var(--muted,#8A8378);font-size:11px}' +
            '.dash-calendar-month-heading strong{font:18px Georgia,serif;color:var(--paper-light,#F6F1E4)}' +
            '.dash-calendar-legend{display:flex;align-items:center;gap:5px;white-space:nowrap}' +
            '.dash-calendar-legend i{display:block;width:10px;height:10px;border-radius:2px;background:var(--gold,#A8823C)}' +
            '.dash-calendar-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:5px}' +
            '.dash-calendar-weekday{padding-bottom:2px;color:var(--muted,#8A8378);font-size:10px;text-align:center;text-transform:uppercase}' +
            '.dash-calendar-blank{min-height:54px}' +
            '.dash-calendar-day{position:relative;display:grid;align-content:start;min-height:54px;padding:3px;border:1px solid rgba(168,130,60,.14);border-radius:3px;background:rgba(0,0,0,.12);color:var(--paper-light,#F6F1E4);overflow:hidden}' +
            '.dash-calendar-day-number{position:relative;z-index:1;display:block;font-size:11px;line-height:1;text-align:right}' +
            '.dash-calendar-day.is-today{border-color:var(--gold,#A8823C);box-shadow:inset 0 0 0 1px rgba(224,187,103,.4)}' +
            '.dash-calendar-day.is-active{border-color:color-mix(in srgb,var(--accent,#8B3A3A) 68%,#fff);background:rgba(168,130,60,.32)}' +
            '.dash-calendar-day.activity-1{background:color-mix(in srgb,var(--accent,#8B3A3A) 28%,transparent)}' +
            '.dash-calendar-day.activity-2{background:color-mix(in srgb,var(--accent,#8B3A3A) 43%,transparent)}' +
            '.dash-calendar-day.activity-3{background:color-mix(in srgb,var(--accent,#8B3A3A) 61%,transparent)}' +
            '.dash-calendar-day.activity-4{background:color-mix(in srgb,var(--accent,#8B3A3A) 82%,transparent);color:#fff9eb}' +
            '.dash-calendar-minutes{display:block;margin-top:10px;color:rgba(255,246,223,.95);font-size:9px;text-align:center}' +
            '.dash-calendar-day-covers{display:flex;align-items:end;justify-content:center;gap:2px;min-width:0;margin-top:4px}' +
            '.dash-calendar-cover-button{display:block;width:18px;height:29px;flex:0 0 18px;padding:0;overflow:hidden;border:1px solid rgba(255,246,223,.72);border-radius:2px;background:var(--bg,#14181C);box-shadow:0 1px 3px rgba(0,0,0,.4);cursor:pointer}' +
            '.dash-calendar-cover-button:focus-visible{outline:2px solid #fff3c8;outline-offset:1px}' +
            '.dash-calendar-cover{display:block;width:100%;height:100%;object-fit:cover}' +
            '.dash-calendar-more-covers{display:grid;place-items:center;width:18px;height:18px;flex:0 0 18px;border:1px solid rgba(255,246,223,.65);border-radius:50%;background:rgba(20,24,28,.78);color:#fff6df;font-size:8px;font-weight:700}' +
            '.dash-calendar-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:14px}' +
            '.dash-calendar-stats div{display:grid;gap:2px;padding:10px 6px;border:1px solid rgba(168,130,60,.2);border-radius:3px;background:rgba(0,0,0,.1);text-align:center}' +
            '.dash-calendar-stats strong{font:20px Georgia,serif;color:var(--gold,#A8823C)}' +
            '.dash-calendar-stats span{color:var(--muted,#8A8378);font-size:10px;text-transform:uppercase}' +
            '.dash-calendar-note{margin:12px 0 0;color:var(--muted,#8A8378);font-size:11px;line-height:1.35}' + '.dash-calendar-export{display:block;width:100%;margin-top:14px;padding:11px;border:1px solid var(--gold,#A8823C);border-radius:3px;background:var(--accent,#8B3A3A);color:var(--paper-light,#F6F1E4);font:inherit;font-weight:700;cursor:pointer}' +
            '.dash-calendar-export:disabled{opacity:.65;cursor:wait}' +
            '.dash-calendar-detail{position:fixed;z-index:1200;inset:0;display:grid;place-items:end center;padding:18px;background:rgba(0,0,0,.68)}' +
            '.dash-calendar-detail-sheet{display:grid;grid-template-columns:76px minmax(0,1fr);gap:14px;width:min(500px,100%);padding:20px;border:1px solid rgba(210,172,88,.65);border-radius:7px;background:var(--bg-elevated,#1B2129);color:var(--paper-light,#F6F1E4);box-shadow:0 16px 40px rgba(0,0,0,.52)}' +
            '.dash-calendar-detail-close{grid-column:2;justify-self:end;width:28px;height:28px;margin:-8px -8px -24px 0;padding:0;border:0;background:transparent;color:var(--paper-light,#F6F1E4);font-size:28px;line-height:1;cursor:pointer}' +
            '.dash-calendar-detail-cover{grid-row:1 / span 2;width:76px;height:114px;object-fit:cover;border-radius:3px;background:var(--bg,#14181C)}' +
            '.dash-calendar-detail-copy{min-width:0;padding-top:18px}' +
            '.dash-calendar-detail-label{display:block;color:var(--gold,#A8823C);font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase}' +
            '.dash-calendar-detail-copy h2{margin:5px 0 0;font:21px/1.1 Georgia,serif;color:var(--paper-light,#F6F1E4)}' +
            '.dash-calendar-detail-author{margin:5px 0 0;color:var(--muted,#8A8378);font-size:12px}' +
            '.dash-calendar-detail-activity{margin:11px 0 0;color:var(--paper-light,#F6F1E4);font-size:13px;line-height:1.35}' +
            '.dash-calendar-detail-meta{margin:7px 0 0;color:var(--muted,#8A8378);font-size:11px;text-transform:capitalize}' +
            '.dash-calendar-detail-library{grid-column:1 / -1;width:100%;padding:11px;border:1px solid var(--gold,#A8823C);border-radius:3px;background:var(--accent,#8B3A3A);color:var(--paper-light,#F6F1E4);font:inherit;cursor:pointer}' +
            '@media (max-width:360px){.dash-calendar-grid{gap:3px}.dash-calendar-day{min-height:49px;padding:2px}.dash-calendar-blank{min-height:49px}.dash-calendar-cover-button{width:15px;height:25px;flex-basis:15px}.dash-calendar-more-covers{width:15px;height:15px;flex-basis:15px;font-size:7px}}';

        document.head.appendChild(style);

        new MutationObserver(function () {
            setTimeout(insertCalendar, 0);
        }).observe(dashboard, {
            childList: true
        });

        window.addEventListener('bookshelf-reading-log-changed', insertCalendar);
            window.addEventListener(
      'bookshelf-appearance-changed',
      insertCalendar
    );
        window.addEventListener('bookshelf-books-changed', insertCalendar);

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') {
                removeDetail();
            }
        });

        insertCalendar();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', install);
    } else {
        install();
    }
})();