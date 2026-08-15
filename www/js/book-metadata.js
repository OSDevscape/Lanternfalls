(function () {
  function addFields() {
    var notes = document.getElementById('fieldNotes');

    if (!notes || document.getElementById('fieldTags')) {
      return;
    }

    var html =
      '<label class="field"><span class="field-label">Tags</span><input id="fieldTags" type="text" placeholder="Sci-Fi, Favorite"></label>' +
      '<label class="field"><span class="field-label">Series</span><input id="fieldSeries" type="text" placeholder="Series name"></label>' +
      '<label class="field"><span class="field-label">Series Number</span><input id="fieldSeriesNumber" type="text" inputmode="decimal" placeholder="Optional"></label>' +
      '<label class="field"><span class="field-label">Collection</span><input id="fieldCollection" type="text" placeholder="Signed Books"></label>';

    notes.closest('.field').insertAdjacentHTML('beforebegin', html);
  }

  document.addEventListener('DOMContentLoaded', addFields);
})();