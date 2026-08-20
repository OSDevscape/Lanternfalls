(function () {
  // A small, generic back-stack for full-screen/overlay panels (currently
  // used by the Bookwyrm Bazaar) so the native Android back button can step
  // through panels one at a time instead of dismissing them outright.
  //
  // Consumers push a "route" object (any shape; a `page` field is the
  // convention already used by "bookshelf-navigation-changed" elsewhere in
  // the app) with navigate(). Every push, pop, or reset re-announces the
  // current route on that same event, so existing listeners don't need to
  // know this module exists.

  var stack = [];

  function clone(route) {
    return route ? Object.assign({}, route) : null;
  }

  function top() {
    return stack.length ? stack[stack.length - 1] : null;
  }

  function announce(route) {
    window.dispatchEvent(new CustomEvent('bookshelf-navigation-changed', {
      detail: { route: clone(route) }
    }));
  }

  function navigate(route) {
    if (!route) return;
    stack.push(clone(route));
    announce(top());
  }

  function replace(route) {
    if (!route) return;
    if (stack.length) stack[stack.length - 1] = clone(route);
    else stack.push(clone(route));
    announce(top());
  }

  function reset(route) {
    stack = route ? [clone(route)] : [];
    announce(top());
  }

  function sync(route) {
    // Sets the stack to match a route that was already applied through some
    // other path, without dispatching a change event.
    stack = route ? [clone(route)] : [];
  }

  function back() {
    if (!stack.length) return false;
    stack.pop();
    announce(top());
    return true;
  }

  function current() {
    return clone(top());
  }

  function hasHistory() {
    return stack.length > 1;
  }

  function isActive() {
    return stack.length > 0;
  }

  window.ReadQuestNavigation = {
    navigate: navigate,
    replace: replace,
    reset: reset,
    sync: sync,
    back: back,
    current: current,
    hasHistory: hasHistory,
    isActive: isActive
  };
})();