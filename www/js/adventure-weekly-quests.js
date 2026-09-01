(function () {
    function escape(value) {
        return String(value == null ? '' : value).replace(/[&<>"']/g, function (character) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            }[character];
        });
    }

    function tooltipButton(message, label) {
        return '<button type="button" class="adventure-weekly-tooltip" ' +
            'data-tooltip="' + escape(message) + '" ' +
            'aria-label="' + escape(label) + '" ' +
            'aria-expanded="false">ⓘ</button>';
    }

    function weeklyQuestFireworks(overlay) {
        var colors = [
            '#ffd369',
            '#ff7a18',
            '#ff4d6d',
            '#9c6bff',
            '#25c8ff',
            '#a9e34b'
        ];

        for (var burst = 0; burst < 5; burst += 1) {            setTimeout(function (burstNumber) {
                return function () {
                    if (!overlay || !overlay.isConnected) {
                        return;
                    }

                    var centerX = 24 + ((burstNumber * 19) % 55);
                    var centerY = 23 + ((burstNumber * 17) % 36);

                    for (var pixelNumber = 0; pixelNumber < 24; pixelNumber += 1) {
                        var angle = Math.PI * 2 * pixelNumber / 24;
                        var distance = 34 + Math.random() * 76;

                        var pixel = document.createElement('i');

                        pixel.className = 'weekly-quest-firework';
                        pixel.style.left = centerX + '%';
                        pixel.style.top = centerY + '%';
                        pixel.style.setProperty(
                            '--dx',
                            Math.cos(angle) * distance + 'px'
                        );
                        pixel.style.setProperty(
                            '--dy',
                            Math.sin(angle) * distance + 'px'
                        );
                        pixel.style.setProperty(
                            '--firework-color',
                            colors[(pixelNumber + burstNumber) % colors.length]
                        );

                        overlay.appendChild(pixel);

                        setTimeout(function (item) {
                            return function () {
                                item.remove();
                            };
                        }(pixel), 950);
                    }
                };
            }(burst), burst * 190);
        }
    }

    function questRow(quest) {
        var progress = Math.max(0, Number(quest.progress) || 0);
        var target = Math.max(1, Number(quest.target) || 1);
        var percent = Math.min(100, Math.round(progress / target * 100));
        var claimed = !!quest.claimedAt;
        var ready = !claimed && progress >= target;
        var status = claimed
            ? 'Claimed'
            : ready
                ? 'Ready'
                : progress + ' / ' + target;

        return (
            '<article class="adventure-weekly-row' +
            (claimed ? ' is-claimed' : '') +
            (ready ? ' is-ready' : '') +
            '">' +

            '<div class="adventure-weekly-row-top">' +
            '<div>' +
            '<b>' + escape(quest.title) + '</b>' +
            '<span>' + escape(quest.detail) + '</span>' +
            '</div>' +
            '<em>' + escape(status) + '</em>' +
            '</div>' +

            '<div class="adventure-weekly-progress">' +
            '<i style="width:' + percent + '%"></i>' +
            '</div>' +

            '<div class="adventure-weekly-reward">' +
            '<span>' + progress + ' / ' + target + '</span>' +
            '<strong>+' + (Number(quest.xp) || 0) +
            ' XP · +' + (Number(quest.gold) || 0) + ' gold</strong>' +
            '</div>' +

            '<button type="button" class="adventure-weekly-claim" ' +
            'data-claim-weekly-quest="' + escape(quest.id) + '" ' +
            (claimed || !ready ? 'disabled' : '') +
            '>' +
            (claimed
                ? 'Quest Claimed'
                : ready
                    ? 'Claim Reward'
                    : 'Quest in Progress') +
            '</button>' +

            '</article>'
        );
    }

    function showRewardPopup(result) {
        var old = document.getElementById('weeklyQuestRewardOverlay');

        if (old) {
            old.remove();
        }

        var quest = result.quest || {};
        var xp = Math.max(0, Number(result.xp) || 0);
        var gold = Math.max(0, Number(result.gold) || 0);

        var overlay = document.createElement('section');

        overlay.id = 'weeklyQuestRewardOverlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute(
            'aria-label',
            'Weekly quest reward for ' + (quest.title || 'completed quest')
        );

        overlay.innerHTML =
            '<div class="weekly-quest-reward-card">' +
            '<span class="adventure-label">Weekly Quest Claimed</span>' +
            '<h2>Quest Complete</h2>' +
            '<p class="weekly-quest-reward-title">' +
            escape(quest.title || 'Weekly Quest') +
            '</p>' +
            '<p class="weekly-quest-reward-detail">' +
            escape(quest.detail || 'Your weekly reading goal is complete.') +
            '</p>' +
            '<div class="weekly-quest-reward-totals">' +
            '<b>+' + xp + ' XP</b>' +
            '<b>+' + gold + ' gold</b>' +
            '</div>' +
            '<button type="button" class="weekly-quest-reward-continue">' +
            'Continue Adventure' +
            '</button>' +
            '</div>';

        var continueButton = overlay.querySelector(
            '.weekly-quest-reward-continue'
        );

        continueButton.onclick = function (event) {
            event.preventDefault();
            event.stopPropagation();
            overlay.remove();
        };

        overlay.onclick = function (event) {
            if (event.target === overlay) {
                overlay.remove();
            }
        };

        document.body.appendChild(overlay);
        weeklyQuestFireworks(overlay);
    }

    function render() {
        var page = document.getElementById('navPlaceholder');

        if (
            !page ||
            page.classList.contains('hidden') ||
            !page.classList.contains('adventure-page') ||
            !window.BookShelfAchievements
        ) {
            return;
        }

        var content = page.querySelector('.adventure-content');

        if (!content || page.dataset.weeklyQuestRendering) {
            return;
        }

        page.dataset.weeklyQuestRendering = 'true';

        var oldBoard = content.querySelector('.adventure-weekly-board');
        var wasOpen = !oldBoard || oldBoard.open;

        if (oldBoard) {
            oldBoard.remove();
        }

        var data = window.BookShelfAchievements.update();
        var quests = Array.isArray(data.quests) ? data.quests.slice() : [];

        quests.sort(function (first, second) {
            var firstClaimed = !!first.claimedAt;
            var secondClaimed = !!second.claimedAt;

            if (firstClaimed !== secondClaimed) {
                return firstClaimed ? 1 : -1;
            }

            return 0;
        });

        if (!quests.length) {
            page.dataset.weeklyQuestRendering = '';
            return;
        }

        var claimedCount = quests.filter(function (quest) {
            return !!quest.claimedAt;
        }).length;

        var readyCount = quests.filter(function (quest) {
            return !quest.claimedAt &&
                (Number(quest.progress) || 0) >= (Number(quest.target) || 0);
        }).length;

        var board = document.createElement('details');

        board.className = 'adventure-card adventure-weekly-board';
        board.open = false;

        board.innerHTML =
            '<summary class="adventure-weekly-board-summary">' +
            '<div>' +
            '<span class="adventure-label">Weekly Quests ' +
            tooltipButton(
                'Weekly Quests reset every Monday. Each quest tracks independently. Complete any quest, then claim its XP and gold reward once.',
                'About Weekly Quests'
            ) +
            '</span>' +
            '<h2>Weekly Quest Board</h2>' +
            '</div>' +

            '<div class="adventure-weekly-board-meta">' +
            '<em>' + claimedCount + ' / ' + quests.length + ' claimed</em>' +
            (readyCount
                ? '<b>' + readyCount + ' ready</b>'
                : '') +
            '<span aria-hidden="true">›</span>' +
            '</div>' +
            '</summary>' +

            '<div class="adventure-weekly-board-body">' +
            '<p class="adventure-muted">Complete any goal this week, then claim its reward.</p>' +
            '<div class="adventure-weekly-list">' +
            quests.map(questRow).join('') +
            '</div>' +
            '</div>';

        var rewardsCard = Array.prototype.filter.call(
            content.querySelectorAll('.adventure-card'),
            function (card) {
                var label = card.querySelector('.adventure-label');

                return label && label.textContent.trim() === 'Rewards Ready';
            }
        )[0];

        if (rewardsCard) {
            rewardsCard.insertAdjacentElement('afterend', board);
        } else {
            content.appendChild(board);
        }

        board.querySelectorAll('[data-claim-weekly-quest]').forEach(function (button) {
            button.onclick = function (event) {
                event.preventDefault();
                event.stopPropagation();

                var result = window.BookShelfAchievements.claimQuest(
                    button.dataset.claimWeeklyQuest
                );

                if (result && result.ok) {
                    showRewardPopup(result);
                    render();
                }
            };
        });

        page.dataset.weeklyQuestRendering = '';
    }

    function install() {
        var page = document.getElementById('navPlaceholder');

        if (!page || page.dataset.weeklyQuestBoardReady) {
            return;
        }

        page.dataset.weeklyQuestBoardReady = 'true';

        var style = document.createElement('style');

        style.textContent =
            '.adventure-weekly-board{padding:0;overflow:hidden;border-color:rgba(168,130,60,.48)}' +
            '.adventure-weekly-board-summary{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px;cursor:pointer;list-style:none}' +
            '.adventure-weekly-board-summary::-webkit-details-marker{display:none}' +
            '.adventure-weekly-board-summary h2{margin:5px 0 0;font:21px Georgia,serif}' +
            '.adventure-weekly-board-meta{display:flex;align-items:center;gap:7px;color:var(--muted,#8A8378);white-space:nowrap}' +
            '.adventure-weekly-board-meta em{font-size:10px;font-style:normal}' +
            '.adventure-weekly-board-meta b{padding:3px 6px;border-radius:9px;background:rgba(168,130,60,.18);color:var(--gold,#A8823C);font-size:10px}' +
            '.adventure-weekly-board-meta>span{display:inline-block;color:var(--gold,#A8823C);font-size:21px;line-height:1;transition:transform .16s ease}' +
            '.adventure-weekly-board[open] .adventure-weekly-board-meta>span{transform:rotate(90deg)}' +
            '.adventure-weekly-board-body{padding:0 16px 16px;border-top:1px solid rgba(168,130,60,.2)}' +
            '.adventure-weekly-list{margin-top:12px;border-top:1px solid rgba(168,130,60,.16)}' +
            '.adventure-weekly-row{padding:13px 0;border-bottom:1px solid rgba(168,130,60,.16)}' +
            '.adventure-weekly-row.is-ready{margin:0 -8px;padding:13px 8px;background:rgba(168,130,60,.08)}' +
            '.adventure-weekly-row.is-claimed{opacity:.58}' +
            '.adventure-weekly-row-top{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}' +
            '.adventure-weekly-row-top>div{min-width:0}' +
            '.adventure-weekly-row-top b,.adventure-weekly-row-top span{display:block}' +
            '.adventure-weekly-row-top b{font:16px Georgia,serif;color:var(--paper-light,#F6F1E4)}' +
            '.adventure-weekly-row-top span{margin-top:3px;color:var(--muted,#8A8378);font-size:11px;line-height:1.35}' +
            '.adventure-weekly-row-top em{padding-top:2px;color:var(--gold,#A8823C);font-size:10px;font-style:normal;text-align:right;white-space:nowrap}' +
            '.adventure-weekly-progress{height:6px;overflow:hidden;margin-top:10px;border-radius:6px;background:rgba(246,241,228,.13)}' +
            '.adventure-weekly-progress i{display:block;height:100%;background:var(--gold,#A8823C)}' +
            '.adventure-weekly-reward{display:flex;justify-content:space-between;gap:10px;margin-top:6px;color:var(--muted,#8A8378);font-size:10px}' +
            '.adventure-weekly-reward strong{color:var(--gold,#A8823C);font-weight:bold;white-space:nowrap}' +
            '.adventure-weekly-claim{width:100%;margin-top:10px;padding:9px;border:1px solid rgba(168,130,60,.48);border-radius:3px;background:transparent;color:var(--paper-light,#F6F1E4);font:inherit;font-size:12px;font-weight:bold}' +
            '.adventure-weekly-claim:not(:disabled){border-color:var(--gold,#A8823C);background:var(--gold,#A8823C);color:#1b1610;cursor:pointer}' +
            '.adventure-weekly-claim:disabled{opacity:.52;cursor:default}' +
            '.adventure-weekly-tooltip{display:inline-flex;align-items:center;justify-content:center;width:15px;height:15px;margin-left:4px;padding:0;border:1px solid currentColor;border-radius:50%;background:transparent;color:inherit;font:700 10px/1 sans-serif;vertical-align:middle;cursor:pointer}' +
            '.adventure-weekly-tooltip:focus-visible{outline:2px solid currentColor;outline-offset:2px}' +
            '#weeklyQuestRewardOverlay{position:fixed;z-index:1300;inset:0;display:grid;place-items:center;padding:24px;overflow:hidden;background:rgba(3,5,8,.82);backdrop-filter:blur(5px)}' +
            '.weekly-quest-reward-card{position:relative;width:min(390px,100%);padding:28px 22px;border:1px solid #d4a64f;border-radius:8px;background:radial-gradient(circle at 50% 0,rgba(212,166,79,.24),transparent 43%),#151a21;color:#f6f1e4;text-align:center;box-shadow:0 18px 60px rgba(0,0,0,.55)}' +
            '.weekly-quest-reward-card h2{margin:10px 0 5px;color:#f5d58f;font:27px Georgia,serif}' +
            '.weekly-quest-reward-title{margin:0;color:#f6f1e4;font:18px Georgia,serif}' +
            '.weekly-quest-reward-detail{margin:6px 0 0;color:#b8b0a3;font-size:13px;line-height:1.4}' +
            '.weekly-quest-reward-totals{display:flex;justify-content:center;gap:22px;margin:20px 0;padding:14px;border-top:1px solid rgba(212,166,79,.25);border-bottom:1px solid rgba(212,166,79,.25)}' +
            '.weekly-quest-reward-totals b{color:#d4a64f;font:20px Georgia,serif}' +
            '.weekly-quest-reward-continue{width:100%;padding:11px;border:1px solid #d4a64f;border-radius:3px;background:#7c3134;color:#f6f1e4;font:inherit;font-weight:bold;cursor:pointer}' +
            '.weekly-quest-reward-continue:focus-visible{outline:2px solid #f5d58f;outline-offset:2px}' +

            '.weekly-quest-firework{' +
            'position:absolute;z-index:3;' +
            'width:7px;height:7px;' +
            'background:var(--firework-color);' +
            'box-shadow:0 0 12px var(--firework-color);' +
            'pointer-events:none;' +
            'animation:weekly-quest-firework-pop .9s steps(8,end) forwards' +
            '}' +

            '@keyframes weekly-quest-firework-pop{' +
            '0%{opacity:1;transform:translate(-50%,-50%) scale(1)}' +
            '70%{opacity:1}' +
            '100%{' +
            'opacity:0;' +
            'transform:translate(' +
            'calc(-50% + var(--dx)),' +
            'calc(-50% + var(--dy))' +
            ') scale(0)' +
            '}' +
            '}' +

            '.weekly-quest-reward-continue:focus-visible{outline:2px solid #f5d58f;outline-offset:2px}';

        document.head.appendChild(style);

        new MutationObserver(function (mutations) {
            var shouldRender = mutations.some(function (mutation) {
                return Array.prototype.some.call(mutation.addedNodes, function (node) {
                    if (node.nodeType !== 1) return false;

                    return (
                        node.matches &&
                        node.matches('.adventure-content')
                    ) ||
                        (
                            node.querySelector &&
                            node.querySelector('.adventure-content')
                        );
                });
            });

            if (shouldRender) {
                setTimeout(render, 50);
            }
        }).observe(page, {
            childList: true,
            subtree: false
        });

        window.addEventListener('bookshelf-reading-log-changed', render);
        window.addEventListener('bookshelf-adventure-claim-complete', render);
        window.addEventListener('bookshelf-adventure-quest-claimed', render);

        render();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', install);
    } else {
        install();
    }
})();