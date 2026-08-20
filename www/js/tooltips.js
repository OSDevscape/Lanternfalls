(function () {
  var activeTrigger = null;
  var tooltip = null;

  function installStyles() {
    var style = document.createElement('style');
    style.textContent = '.tooltip-trigger,.adventure-tooltip-trigger{display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;margin-left:4px;padding:0;border:1px solid currentColor;border-radius:50%;background:transparent;color:inherit;font:700 12px/1 sans-serif;vertical-align:middle;cursor:pointer}.tooltip-trigger:focus-visible,.adventure-tooltip-trigger:focus-visible{outline:2px solid var(--gold,#d9a441);outline-offset:2px}.rq-tooltip{position:fixed;z-index:3000;max-width:min(280px,calc(100vw - 32px));padding:10px 12px;border:1px solid rgba(217,164,65,.65);border-radius:8px;background:#1a1b22;color:#f3eff5;box-shadow:0 8px 24px rgba(0,0,0,.35);font:13px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;pointer-events:none}.rq-tooltip[hidden]{display:none!important}@media (prefers-color-scheme:light){.rq-tooltip{background:#fffdf8;color:#2a241e;box-shadow:0 8px 24px rgba(42,36,30,.18)}}';
    document.head.appendChild(style);
  }

  function ensureTooltip() {
    if (tooltip) return tooltip;
    tooltip = document.createElement('div');
    tooltip.className = 'rq-tooltip';
    tooltip.id = 'rqTooltip';
    tooltip.setAttribute('role', 'tooltip');
    tooltip.hidden = true;
    document.body.appendChild(tooltip);
    return tooltip;
  }

  function position(trigger) {
    var tip = ensureTooltip();
    var rect = trigger.getBoundingClientRect();
    var gap = 8;
    var left = Math.max(16, Math.min(rect.left, window.innerWidth - tip.offsetWidth - 16));
    var top = rect.bottom + gap;

    if (top + tip.offsetHeight > window.innerHeight - 16) {
      top = Math.max(16, rect.top - tip.offsetHeight - gap);
    }

    tip.style.left = Math.round(left) + 'px';
    tip.style.top = Math.round(top) + 'px';
  }

  function close() {
    if (activeTrigger) {
      activeTrigger.setAttribute('aria-expanded', 'false');
      activeTrigger.removeAttribute('aria-describedby');
    }
    if (tooltip) tooltip.hidden = true;
    activeTrigger = null;
  }

  function open(trigger) {
    var message = trigger.getAttribute('data-tooltip');
    if (!message) return;
    if (activeTrigger === trigger) {
      close();
      return;
    }

    close();
    var tip = ensureTooltip();
    tip.textContent = message;
    tip.hidden = false;
    activeTrigger = trigger;
    trigger.setAttribute('aria-expanded', 'true');
    trigger.setAttribute('aria-describedby', tip.id);
    position(trigger);
  }

  function isTooltipTrigger(element) {
    return element && element.closest && element.closest('[data-tooltip]');
  }

  function install() {
    installStyles();

    document.addEventListener('click', function (event) {
      var trigger = event.target.closest(
        'button[data-tooltip], [role="button"][data-tooltip], [tabindex][data-tooltip]'
      );

      if (trigger && trigger.hasAttribute('data-tooltip')) {
        event.preventDefault();
        event.stopPropagation();
        open(trigger);
        return;
      }

      close();
    }, true);

    document.addEventListener('pointerdown', function (event) {
      var trigger = event.target.closest(
        'button[data-tooltip], [role="button"][data-tooltip], [tabindex][data-tooltip]'
      );

      if (!trigger && !event.target.closest('.rq-tooltip')) close();
    }, true);

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') close();
    });

    document.addEventListener('keydown', function (event) {
      var trigger = event.target.closest &&
        event.target.closest('[role="button"][data-tooltip], [tabindex][data-tooltip]');

      if (!trigger) return;

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        open(trigger);
      }
    });

    window.addEventListener('resize', function () {
      if (activeTrigger && tooltip && !tooltip.hidden) position(activeTrigger);
    });

    window.addEventListener('scroll', function () {
      if (activeTrigger && tooltip && !tooltip.hidden) position(activeTrigger);
    }, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();