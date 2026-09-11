const assert = require('assert');
const path = require('path');

async function testSuite() {
  const plugin = require(path.resolve(__dirname, '../dist/plugins/cote-reader.js')).default;

  // 1. Metadata
  assert.strictEqual(plugin.id, 'cote-reader');
  assert.strictEqual(plugin.name, 'COTE Reader');
  assert.strictEqual(plugin.site, 'https://cote-reader.me');
  assert.strictEqual(plugin.version, '1.0.0');
  assert.ok(plugin.filters.tag);
  console.log('✓ metadata validation');

  // 2. popularNovels
  const popular = await plugin.popularNovels(1, { filters: { tag: { value: '' } } });
  assert.ok(Array.isArray(popular) && popular.length > 0);
  assert.ok(popular[0].name && popular[0].path.startsWith('/novel/') && popular[0].cover.startsWith('http'));
  console.log(`✓ popularNovels (returned ${popular.length} items)`);

  // 3. Filters
  const filtered = await plugin.popularNovels(1, { filters: { tag: { value: 'Psychological' } } });
  assert.ok(Array.isArray(filtered) && filtered.length > 0);
  console.log(`✓ tag filtering (returned ${filtered.length} items)`);

  // 4. searchNovels
  const searchResults = await plugin.searchNovels('classroom', 1);
  assert.ok(Array.isArray(searchResults) && searchResults.length > 0);
  assert.ok(searchResults.some(n => n.name.toLowerCase().includes('classroom of the elite')));
  console.log(`✓ searchNovels (found ${searchResults.length} matches)`);

  // 5. Canonical novel (COTE)
  const coteNovel = await plugin.parseNovel('/novel/cote');
  assert.strictEqual(coteNovel.name, 'Classroom of the Elite');
  assert.ok(coteNovel.totalPages >= 60);
  assert.ok(coteNovel.chapters.length > 0);
  console.log(`✓ parseNovel canonical (${coteNovel.name}, ${coteNovel.totalPages} volumes)`);

  // 6. Canonical pagination (Volume 2)
  const cotePage2 = await plugin.parsePage('/novel/cote', '2');
  assert.ok(cotePage2 && cotePage2.chapters.length > 0);
  console.log(`✓ parsePage canonical (volume 2, ${cotePage2.chapters.length} chapters)`);

  // 7. Canonical chapter content
  const firstChapterPath = coteNovel.chapters[0].path;
  const chapterHtml = await plugin.parseChapter(firstChapterPath);
  assert.ok(chapterHtml && chapterHtml.length > 100);
  assert.ok(!chapterHtml.includes('src="/assets/'));
  console.log(`✓ parseChapter canonical (${chapterHtml.length} bytes)`);

  // 8. Non-canonical novel (The Eminence in Shadow)
  const shadowNovel = await plugin.parseNovel('/novel/8821');
  assert.strictEqual(shadowNovel.name, 'The Eminence in Shadow');
  assert.ok(shadowNovel.chapters.length > 0);
  console.log(`✓ parseNovel non-canonical (${shadowNovel.name}, ${shadowNovel.totalPages} volumes)`);

  // 9. Non-canonical chapter content
  const shadowChapterPath = shadowNovel.chapters.find(c => c.chapterNumber >= 4)?.path || shadowNovel.chapters[0].path;
  const shadowChapterHtml = await plugin.parseChapter(shadowChapterPath);
  assert.ok(shadowChapterHtml && shadowChapterHtml.length > 100);
  console.log(`✓ parseChapter non-canonical (${shadowChapterHtml.length} bytes)`);

  console.log('\n9 passed (100%)\n');
}

testSuite().catch(err => {
  console.error(err);
  process.exit(1);
});
