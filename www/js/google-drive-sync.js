
(function () {
  var CLIENT_ID = '593940582784-crga2h0rme3mk5qvehik0iv6elbp2f8n.apps.googleusercontent.com';
  var DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';
  var BACKUP_NAME = 'lanternfalls-sync.json';
  var LEGACY_BACKUP_NAME = 'bookshelf-sync.json';
  var initialized = false;

  function readJson(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || fallback); }
    catch (_) { return JSON.parse(fallback); }
  }

  function setStatus(message, error) {
    var status = document.getElementById('googleDriveStatus');
    if (!status) return;
    status.textContent = message;
    status.classList.toggle('google-drive-error', !!error);
  }

  function plugin() {
    return window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.SocialLogin;
  }

  async function accessToken() {
    var socialLogin = plugin();
    if (!socialLogin) throw new Error('Google sign-in is unavailable. Rebuild and reinstall the Android app after syncing Capacitor.');

    if (!initialized) {
      await socialLogin.initialize({
        google: { webClientId: CLIENT_ID }
      });
      initialized = true;
    }

    var response = await socialLogin.login({
      provider: 'google',
      options: {
        scopes: ['email', 'profile', DRIVE_SCOPE],
        forceRefreshToken: true
      }
    });
    var token = response && response.result && response.result.accessToken && response.result.accessToken.token;
    if (!token) throw new Error('Google did not return Drive permission. Confirm that the signed-in account is listed as a test user.');
    return token;
  }

  async function drive(url, options, token) {
    var response = await fetch(url, Object.assign({}, options || {}, {
      headers: Object.assign({}, (options && options.headers) || {}, {
        Authorization: 'Bearer ' + token
      })
    }));
    if (!response.ok) {
      var text = await response.text();
      throw new Error('Google Drive error ' + response.status + (text ? ': ' + text : ''));
    }
    return response;
  }

  async function backupFile(token) {
    var names = [BACKUP_NAME, LEGACY_BACKUP_NAME];
    var query = encodeURIComponent(
      '(' +
      names.map(function (name) {
        return "name = '" + name + "'";
      }).join(' or ') +
      ') and trashed = false'
    );

    var response = await drive(
      'https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=' +
      query +
      '&fields=files(id,name,modifiedTime)',
      { method: 'GET' },
      token
    );

    var data = await response.json();
    var files = data.files || [];

    files.sort(function (a, b) {
      return new Date(b.modifiedTime) - new Date(a.modifiedTime);
    });

    return files[0] || null;
  }

  function settings() {
    var result = {};
    for (var i = 0; i < localStorage.length; i += 1) {
      var key = localStorage.key(i);
      if (key && key.indexOf('bookshelf-') === 0 && key !== 'bookshelf-data' && key !== 'bookshelf-metadata-v12') {
        result[key] = localStorage.getItem(key);
      }
    }
    return result;
  }

  async function snapshot() {
    var books = await window.BookStorage.loadBooks();
    return {
      format: 'bookshelf-drive-sync',
      version: 1,
      updatedAt: new Date().toISOString(),
      books: books,
      metadata: readJson('bookshelf-metadata-v12', '{}'),
      settings: settings()
    };
  }

  async function uploadBackup(token, contents) {
    var file = await backupFile(token);
    var body = JSON.stringify(contents, null, 2);
    if (!file) {
      var create = await drive(
        'https://www.googleapis.com/drive/v3/files',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: BACKUP_NAME, parents: ['appDataFolder'], mimeType: 'application/json' })
        },
        token
      );
      file = await create.json();
    }
    await drive(
      'https://www.googleapis.com/upload/drive/v3/files/' + encodeURIComponent(file.id) + '?uploadType=media',
      { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: body },
      token
    );
  }

  async function downloadBackup(token) {
    var file = await backupFile(token);
    if (!file) throw new Error('No Lanternfalls  backup was found in Google Drive yet. Back up a device first.');
    var response = await drive(
      'https://www.googleapis.com/drive/v3/files/' + encodeURIComponent(file.id) + '?alt=media',
      { method: 'GET' },
      token
    );
    var data = await response.json();
    if (!data || data.format !== 'bookshelf-drive-sync' || !Array.isArray(data.books)) {
      throw new Error('The Google Drive backup is not a valid Lanternfalls sync file.');
    }
    return data;
  }

  function restoreSettings(data, replacing) {
    if (replacing) {
      var remove = [];
      for (var i = 0; i < localStorage.length; i += 1) {
        var key = localStorage.key(i);
        if (key && key.indexOf('bookshelf-') === 0 && key !== 'bookshelf-data') remove.push(key);
      }
      remove.forEach(function (key) { localStorage.removeItem(key); });
    }
    Object.keys(data.settings || {}).forEach(function (key) {
      localStorage.setItem(key, data.settings[key]);
    });
  }

  async function backup() {
    setStatus('Connecting to Google Drive...');
    var token = await accessToken();
    setStatus('Backing up your library...');
    await uploadBackup(token, await snapshot());
    setStatus('Backed up to Google Drive at ' + new Date().toLocaleString() + '.');
  }

  async function restore(mode) {
    var label = mode === 'merge' ? 'merge' : 'replace';
    if (!window.confirm('Restore from Google Drive and ' + label + ' this device\'s library?')) return;

    setStatus('Connecting to Google Drive...');
    var token = await accessToken();
    setStatus('Downloading your backup...');
    var remote = await downloadBackup(token);
    var current = await window.BookStorage.loadBooks();
    var books = mode === 'merge' ? window.BookStorage.mergeBooks(current, remote.books) : remote.books;
    var currentMetadata = readJson('bookshelf-metadata-v12', '{}');
    var metadata = mode === 'merge'
      ? Object.assign({}, currentMetadata, remote.metadata || {})
      : (remote.metadata || {});

    await window.BookStorage.saveBooks(books);
    localStorage.setItem('bookshelf-metadata-v12', JSON.stringify(metadata));
    restoreSettings(remote, mode !== 'merge');
    setStatus('Restore complete. Reloading Lanternfalls...')
    setTimeout(function () { window.location.reload(); }, 700);
  }

  function install() {
    var menu = document.querySelector('#menuSheet .menu-card');
    if (!menu || document.getElementById('googleDriveSync')) return;

    var style = document.createElement('style');

    style.textContent =
      '#menuSheet{box-sizing:border-box;padding-bottom:130px!important}' +
      '#menuSheet .menu-card{margin-bottom:110px!important}' +
      '#googleDriveSync{margin-top:18px;padding-top:16px;border-top:1px solid rgba(168,130,60,.28)}' +
      '#googleDriveSync h3{margin:0 0 8px;color:#A8823C;font:16px Georgia,serif}' +
      '#googleDriveSync .google-drive-actions{display:grid;gap:8px}' +
      '#googleDriveSync button{width:100%;padding:11px;border:1px solid #A8823C;border-radius:3px;background:#1B2129;color:#F6F1E4;text-align:left;cursor:pointer}' +
      '#googleDriveStatus{margin:10px 0 0;color:#8A8378;font-size:12px;line-height:1.35}' +
      '.google-drive-error{color:#e59a9a!important}';

    document.head.appendChild(style);

    var box = document.createElement('section');
    box.id = 'googleDriveSync';
    box.innerHTML = '<h3>Lanternfalls Google Drive Sync</h3><div class="google-drive-actions"><button type="button" data-drive="connect">Connect Google Drive</button><button type="button" data-drive="backup">Back up to Google Drive</button><button type="button" data-drive="merge">Restore and Merge from Google Drive</button><button type="button" data-drive="replace">Restore and Replace from Google Drive</button></div><p id="googleDriveStatus">Manual backup only. Your sync file is stored privately in Google Drive.</p>';
    menu.appendChild(box);

    box.onclick = async function (event) {
      var button = event.target.closest('[data-drive]');
      if (!button) return;
      var action = button.dataset.drive;
      try {
        button.disabled = true;
        if (action === 'connect') {
          setStatus('Connecting to Google Drive...');
          await accessToken();
          setStatus('Google Drive connected.');
        } else if (action === 'backup') {
          await backup();
        } else {
          await restore(action);
        }
      } catch (error) {
        console.error(error);
        setStatus(error && error.message ? error.message : 'Google Drive sync failed.', true);
      } finally {
        button.disabled = false;
      }
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();