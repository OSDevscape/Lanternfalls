(function () {
  'use strict';

  function setExpanded(button, panel, expanded) {
    button.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    panel.classList.toggle('hidden', !expanded);
  }

  function makeCollapsible(id, title, summary) {
    var section = document.createElement('section');
    var button = document.createElement('button');
    var panel = document.createElement('div');
    var titleNode = document.createElement('span');
    var summaryNode = document.createElement('span');
    var chevron = document.createElement('span');

    section.id = id;
    section.className = 'library-transfer-child';

    button.type = 'button';
    button.className = 'library-transfer-toggle';
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', id + 'Panel');

    titleNode.className = 'library-transfer-title';
    titleNode.textContent = title;

    summaryNode.className = 'library-transfer-summary';
    summaryNode.textContent = summary;

    chevron.className = 'library-transfer-chevron';
    chevron.setAttribute('aria-hidden', 'true');
    chevron.textContent = '›';

    button.append(titleNode, summaryNode, chevron);

    panel.id = id + 'Panel';
    panel.className = 'library-transfer-panel hidden';

    button.addEventListener('click', function () {
      setExpanded(
        button,
        panel,
        button.getAttribute('aria-expanded') !== 'true'
      );
    });

    section.append(button, panel);

    return {
      section: section,
      panel: panel
    };
  }

  function moveIfPresent(panel, selector) {
    var element = document.querySelector(selector);

    if (element) {
      panel.appendChild(element);
    }
  }

  function moveJsonControls(jsonPanel) {
    moveIfPresent(jsonPanel, '#exportBtn');
    moveIfPresent(jsonPanel, '#importBtn');
    moveIfPresent(jsonPanel, '#importFile');
    moveIfPresent(jsonPanel, '#menuSheet .menu-hint');
  }

  function moveGoodreadsControls(goodreadsPanel) {
    var box = document.getElementById('goodreadsImport');

    if (!box) {
      return false;
    }

    goodreadsPanel.appendChild(box);
    return true;
  }

  function moveDriveControls(drivePanel) {
    var box = document.getElementById('googleDriveSync');

    if (!box) {
      return false;
    }

    drivePanel.appendChild(box);
    return true;
  }

  function buildMenu() {
    var menu = document.querySelector('#menuSheet .menu-card');

    if (!menu || document.getElementById('libraryTransferCard')) {
      return false;
    }

    var exportButton = document.getElementById('exportBtn');
    var importButton = document.getElementById('importBtn');
    var goodreads = document.getElementById('goodreadsImport');
    var drive = document.getElementById('googleDriveSync');

    if (!exportButton || !importButton || !goodreads || !drive) {
      return false;
    }

    var card = document.createElement('section');
    var parentButton = document.createElement('button');
    var parentTitle = document.createElement('span');
    var parentSummary = document.createElement('span');
    var parentChevron = document.createElement('span');
    var parentPanel = document.createElement('div');

    card.id = 'libraryTransferCard';
    card.className = 'library-transfer-card';

    parentButton.type = 'button';
    parentButton.className = 'library-transfer-parent-toggle';
    parentButton.setAttribute('aria-expanded', 'false');
    parentButton.setAttribute('aria-controls', 'libraryTransferPanel');

    parentTitle.className = 'library-transfer-parent-title';
    parentTitle.textContent = 'Import & Restore';

    parentSummary.className = 'library-transfer-parent-summary';
    parentSummary.textContent =
      'JSON, Goodreads CSV, and Google Drive library tools';

    parentChevron.className = 'library-transfer-parent-chevron';
    parentChevron.setAttribute('aria-hidden', 'true');
    parentChevron.textContent = '›';

    parentButton.append(parentTitle, parentSummary, parentChevron);

    parentPanel.id = 'libraryTransferPanel';
    parentPanel.className = 'library-transfer-parent-panel hidden';

    parentButton.addEventListener('click', function () {
      setExpanded(
        parentButton,
        parentPanel,
        parentButton.getAttribute('aria-expanded') !== 'true'
      );
    });

    var json = makeCollapsible(
      'libraryJsonTransfer',
      'Lanternfalls JSON',
      'Export or import a portable library backup'
    );

    var goodreadsCard = makeCollapsible(
      'libraryGoodreadsTransfer',
      'Goodreads CSV',
      'Import, merge, or replace from a Goodreads export'
    );

    var driveCard = makeCollapsible(
      'libraryDriveTransfer',
      'Google Drive Sync',
      'Manual private backup and restore'
    );

    moveJsonControls(json.panel);
    moveGoodreadsControls(goodreadsCard.panel);
    moveDriveControls(driveCard.panel);

    parentPanel.append(
      json.section,
      goodreadsCard.section,
      driveCard.section
    );

    card.append(parentButton, parentPanel);
    menu.appendChild(card);

    return true;
  }

  function install() {
    if (buildMenu()) {
      return;
    }

    var attempts = 0;
    var retry = window.setInterval(function () {
      attempts += 1;

      if (buildMenu() || attempts >= 30) {
        window.clearInterval(retry);
      }
    }, 100);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install);
  } else {
    install();
  }
})();