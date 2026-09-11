const assert = require('assert');
const path = require('path');

async function testSuite() {
  const plugin = require(path.resolve(__dirname, '../dist/plugins/cote-reader.js')).default;

  // 1. Metadata
  assert.strictEqual(plugin.id, 'cote-reader');
  assert.strictEqual(plugin.name, 'COTE Reader');
  assert.strictEqual(plugin.site, 'https://cote-reader.me');
  assert.strictEqual(plugin.version, '1.0.1');
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

  // 5. Canonical novel (COTE) - all volumes in one list ordered by volume
  const coteNovel = await plugin.parseNovel('/novel/cote');
  assert.strictEqual(coteNovel.name, 'Classroom of the Elite');
  assert.ok(Array.isArray(coteNovel.chapters) && coteNovel.chapters.length >= 60);
  assert.strictEqual(coteNovel.chapters[0].chapterNumber, 1);
  assert.strictEqual(coteNovel.chapters[1].chapterNumber, 2);
  console.log(`✓ parseNovel canonical (all ${coteNovel.chapters.length} volumes in single ordered list)`);
  console.log(`   Sample: "${coteNovel.chapters[0].name}" -> ${coteNovel.chapters[0].path}`);

  // 6. Canonical volume chapter reading
  const firstVolPath = coteNovel.chapters[0].path;
  const chapterHtml = await plugin.parseChapter(firstVolPath);
  assert.ok(chapterHtml && chapterHtml.length > 100);
  assert.ok(!chapterHtml.includes('src="/assets/'));
  console.log(`✓ parseChapter canonical volume (${chapterHtml.length} bytes)`);

  // 7. Non-canonical novel (The Eminence in Shadow - 8821)
  const shadowNovel = await plugin.parseNovel('/novel/8821');
  assert.strictEqual(shadowNovel.name, 'The Eminence in Shadow');
  assert.ok(Array.isArray(shadowNovel.chapters) && shadowNovel.chapters.length >= 6);
  assert.strictEqual(shadowNovel.chapters[0].chapterNumber, 1);
  console.log(`✓ parseNovel non-canonical (all ${shadowNovel.chapters.length} volumes in single ordered list)`);
  console.log(`   Sample: "${shadowNovel.chapters[0].name}" -> ${shadowNovel.chapters[0].path}`);

  // 8. Non-canonical volume chapter reading
  const shadowVolPath = shadowNovel.chapters[0].path;
  const shadowHtml = await plugin.parseChapter(shadowVolPath);
  assert.ok(shadowHtml && shadowHtml.length > 100);
  console.log(`✓ parseChapter non-canonical volume (${shadowHtml.length} bytes)`);

  console.log('\n8 passed (100%)\n');
}

testSuite().catch(err => {
  console.error(err);
  process.exit(1);
});
