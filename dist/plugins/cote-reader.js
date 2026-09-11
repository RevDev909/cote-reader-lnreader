"use strict";

Object.defineProperty(exports, "__esModule", { value: true });

var fetchApi;
try {
    fetchApi = require("@libs/fetch").fetchApi;
} catch (e) {
    fetchApi = function (url, init) { return fetch(url, init); };
}

var FilterTypes = {
    TextInput: "Text",
    Picker: "Picker",
    CheckboxGroup: "Checkbox",
    Switch: "Switch",
    ExcludableCheckboxGroup: "XCheckbox"
};
try {
    var filterLibs = require("@libs/filterInputs");
    if (filterLibs && filterLibs.FilterTypes) {
        FilterTypes = filterLibs.FilterTypes;
    }
} catch (e) {}

var NovelStatus = {
    Unknown: "Unknown",
    Ongoing: "Ongoing",
    Completed: "Completed",
    Licensed: "Licensed",
    PublishingFinished: "Publishing Finished",
    Cancelled: "Cancelled",
    OnHiatus: "On Hiatus"
};
try {
    var statusLibs = require("@libs/novelStatus");
    if (statusLibs && statusLibs.NovelStatus) {
        NovelStatus = statusLibs.NovelStatus;
    }
} catch (e) {}

var defaultCover = "https://github.com/LNReader/lnreader-plugins/blob/main/icons/src/coverNotAvailable.jpg?raw=true";
try {
    var coverLibs = require("@libs/defaultCover");
    if (coverLibs && coverLibs.defaultCover) {
        defaultCover = coverLibs.defaultCover;
    }
} catch (e) {}

class CoteReader {
    constructor() {
        this.id = "cotereader";
        this.name = "COTE Reader";
        this.site = "https://cote-reader.me";
        this.icon = "src/en/cotereader/icon.png";
        this.version = "1.0.5";

        this.canonicalIds = new Set([
            "cote",
            "lotm",
            "rezero",
            "bunny-girl",
            "mushoku-tensei",
            "orv",
            "world",
            "reverend-insanity",
            "apothecary-diaries",
            "tensura",
            "tbate",
            "eightysix",
            "monogatari"
        ]);

        this.aliasMap = {
            "4557": "cote",
            "3336": "mushoku-tensei",
            "3486": "bunny-girl",
            "1014": "monogatari",
            "3343": "rezero",
            "6547": "eightysix",
            "3580": "tensura",
            "3768": "apothecary-diaries",
            "10839": "lotm",
            "200298": "2958"
        };

        this.filters = {
            tag: {
                value: "",
                label: "Genre / Tag",
                options: [
                    { label: "All", value: "" },
                    { label: "Action", value: "Action" },
                    { label: "Adventure", value: "Adventure" },
                    { label: "Comedy", value: "Comedy" },
                    { label: "Dark Fantasy", value: "Dark Fantasy" },
                    { label: "Drama", value: "Drama" },
                    { label: "Fantasy", value: "Fantasy" },
                    { label: "Historical", value: "Historical" },
                    { label: "Isekai", value: "Isekai" },
                    { label: "Mystery", value: "Mystery" },
                    { label: "Psychological", value: "Psychological" },
                    { label: "Romance", value: "Romance" },
                    { label: "School", value: "School" },
                    { label: "Sci-Fi", value: "Sci-Fi" },
                    { label: "Slice of Life", value: "Slice of Life" },
                    { label: "Supernatural", value: "Supernatural" }
                ],
                type: FilterTypes.Picker
            }
        };
    }

    formatCover(cover) {
        if (!cover) return defaultCover;
        if (cover.startsWith("http://") || cover.startsWith("https://")) return cover;
        if (cover.startsWith("/")) return this.site + cover;
        return this.site + "/" + cover;
    }

    cleanId(novelPath) {
        return novelPath
            .replace(/^\/?novel\//i, "")
            .replace(/^\//, "")
            .split("/")[0]
            .trim();
    }

    async safeJson(res) {
        const text = await res.text();
        if (!text || !text.trim()) {
            throw new Error("Received empty response from server. Please retry in a moment.");
        }
        try {
            return JSON.parse(text);
        } catch (e) {
            if (text.includes("<!DOCTYPE") || text.includes("<html")) {
                throw new Error("Server returned an error page instead of novel content. Please retry.");
            }
            throw new Error("Stream interrupted by server (unexpected end of input). Retrying...");
        }
    }

    async popularNovels(pageNo, options) {
        let url = this.site + "/api/novels?page=" + pageNo + "&limit=20";
        const filters = options && options.filters;
        if (filters && filters.tag && filters.tag.value) {
            url += "&tag=" + encodeURIComponent(filters.tag.value);
        }

        const res = await fetchApi(url);
        if (!res.ok) {
            throw new Error("Failed to load popular novels: HTTP " + res.status);
        }

        const data = await this.safeJson(res);
        const items = data.items || [];
        const seenPaths = new Set();
        const seenTitles = new Set();
        const result = [];

        for (const novel of items) {
            const targetId = this.aliasMap[novel.id] || novel.id;
            const path = "/novel/" + targetId;
            const normTitle = novel.title.toLowerCase().replace(/[^a-z0-9]/g, "");
            if (seenPaths.has(path) || seenTitles.has(normTitle)) {
                continue;
            }
            seenPaths.add(path);
            seenTitles.add(normTitle);
            result.push({
                name: novel.title,
                path: path,
                cover: this.formatCover(novel.cover)
            });
        }
        return result;
    }

    async searchNovels(searchTerm, pageNo) {
        const url = this.site + "/api/novels?q=" + encodeURIComponent(searchTerm) + "&page=" + pageNo + "&limit=20";
        const res = await fetchApi(url);
        if (!res.ok) {
            throw new Error("Failed to search novels: HTTP " + res.status);
        }

        const data = await this.safeJson(res);
        const items = data.items || [];
        const seenPaths = new Set();
        const seenTitles = new Set();
        const result = [];

        for (const novel of items) {
            const targetId = this.aliasMap[novel.id] || novel.id;
            const path = "/novel/" + targetId;
            const normTitle = novel.title.toLowerCase().replace(/[^a-z0-9]/g, "");
            if (seenPaths.has(path) || seenTitles.has(normTitle)) {
                continue;
            }
            seenPaths.add(path);
            seenTitles.add(normTitle);
            result.push({
                name: novel.title,
                path: path,
                cover: this.formatCover(novel.cover)
            });
        }
        return result;
    }

    async parseNovel(novelPath) {
        const rawId = this.cleanId(novelPath);
        const id = this.aliasMap[rawId] || rawId;
        const metaUrl = this.site + "/api/novels/" + id;
        const res = await fetchApi(metaUrl);
        if (!res.ok) {
            throw new Error("Failed to load novel metadata: HTTP " + res.status);
        }

        const data = await this.safeJson(res);
        const genres = Array.isArray(data.tags)
            ? data.tags.join(", ")
            : Array.isArray(data.genres)
            ? data.genres.join(", ")
            : undefined;

        // Special handling for webnovels with dedicated chapter summary files (ORV & World)
        if (id === "orv" || id === "world") {
            try {
                const sumUrl = this.site + "/assets/" + id + "/summary.json";
                const sumRes = await fetchApi(sumUrl);
                if (sumRes.ok) {
                    const summary = await this.safeJson(sumRes);
                    const allChs = [
                        ...(summary.mainChapters || []),
                        ...(summary.contChapters || []),
                        ...(summary.sideChapters || [])
                    ];
                    if (allChs.length > 0) {
                        const chapters = allChs.map((ch, idx) => ({
                            name: ch.title,
                            path: "/webnovel/" + id + "/" + ch.id,
                            chapterNumber: idx + 1
                        }));
                        return {
                            path: novelPath,
                            name: data.title,
                            cover: this.formatCover(data.cover),
                            summary: data.description,
                            author: data.author,
                            genres: genres,
                            status: NovelStatus.Ongoing,
                            chapters: chapters
                        };
                    }
                }
            } catch (e) {}
        }

        const volumes = data.volumes || [];
        const isCanonical = this.canonicalIds.has(id.toLowerCase());
        const chapters = volumes.map((volume, index) => {
            const position = index + 1;
            const numStr = String(position).padStart(2, "0");
            const rawTitle = volume.title || ("Volume " + position);
            const name = "Vol. " + numStr + ": " + rawTitle;
            const path = isCanonical
                ? "/canonical/" + id + "/" + volume.id
                : "/api/novels/" + id + "/volume/" + volume.id;
            return {
                name: name,
                path: path,
                chapterNumber: position
            };
        });

        return {
            path: novelPath,
            name: data.title,
            cover: this.formatCover(data.cover),
            summary: data.description,
            author: data.author,
            genres: genres,
            status: NovelStatus.Ongoing,
            chapters: chapters
        };
    }

    async parseChapter(chapterPath) {
        let rawHtml = "";

        if (chapterPath.startsWith("/webnovel/")) {
            const parts = chapterPath.replace(/^\/webnovel\//, "").split("/");
            const id = parts[0];
            const chapterId = parts[1];
            const chUrl = this.site + "/assets/" + id + "/chapters/" + chapterId + ".json";
            const res = await fetchApi(chUrl);
            if (!res.ok) {
                throw new Error("Failed to fetch chapter: HTTP " + res.status);
            }
            const chData = await this.safeJson(res);
            rawHtml = chData.contentHtml || chData.content || "";
        } else if (chapterPath.startsWith("/canonical/")) {
            const parts = chapterPath.replace(/^\/canonical\//, "").split("/");
            const id = parts[0];
            const volumeId = parts[1];
            const chapterKey = parts[2];

            const cacheUrl = this.site + "/assets/cache/" + id + "/" + volumeId + ".json";
            const res = await fetchApi(cacheUrl);
            if (!res.ok) {
                if (res.status === 404) {
                    throw new Error("This volume is not yet available on COTE Reader (HTTP 404).");
                }
                throw new Error("Failed to fetch volume: HTTP " + res.status);
            }

            const json = await this.safeJson(res);
            if (chapterKey && json[chapterKey]) {
                rawHtml = json[chapterKey].content || "";
            } else {
                const keys = Object.keys(json).sort((a, b) => Number(a) - Number(b));
                rawHtml = keys
                    .map((k) => {
                        const item = json[k];
                        const title = item.title || ("Chapter " + k);
                        return '<section class="volume-chapter"><h2 class="volume-chapter-title">' + title + '</h2>' + (item.content || "") + '</section>';
                    })
                    .join('\n<hr class="volume-divider" />\n');
            }
        } else if (chapterPath.startsWith("/api/novels/")) {
            const parts = chapterPath.replace(/^\/api\/novels\//, "").split("/");
            const id = parts[0];
            const volumeId = parts[2];
            const chapterIndex = parts[3];

            const volUrl = this.site + "/api/novels/" + id + "/volume/" + volumeId;
            let lastErr = null;
            let volData = null;

            for (let attempt = 0; attempt < 3; attempt++) {
                try {
                    const res = await fetchApi(volUrl);
                    if (res.status === 503) {
                        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
                        continue;
                    }
                    if (!res.ok) {
                        throw new Error("Failed to fetch volume: HTTP " + res.status);
                    }
                    volData = await this.safeJson(res);
                    break;
                } catch (e) {
                    lastErr = e;
                    if (attempt < 2) {
                        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
                    }
                }
            }

            if (!volData) {
                if (lastErr && lastErr.message && lastErr.message.includes("503")) {
                    throw new Error("Remote server is busy (HTTP 503: Cloudflare Worker limit). Please retry in a moment.");
                }
                throw (
                    lastErr ||
                    new Error("Failed to load volume: Connection was interrupted. Please retry in a moment.")
                );
            }

            if (chapterIndex && volData.chapters && volData.chapters[chapterIndex]) {
                rawHtml = volData.chapters[chapterIndex].content || "";
            } else {
                const chaptersObj = volData.chapters || {};
                const toc = volData.toc || [];
                if (toc.length > 0) {
                    rawHtml = toc
                        .map((item) => {
                            const ch = chaptersObj[item.chapterIndex];
                            return '<section class="volume-chapter"><h2 class="volume-chapter-title">' + item.title + '</h2>' + ((ch && ch.content) || "") + '</section>';
                        })
                        .join('\n<hr class="volume-divider" />\n');
                } else {
                    const keys = Object.keys(chaptersObj).sort((a, b) => Number(a) - Number(b));
                    rawHtml = keys
                        .map((k) => '<section class="volume-chapter">' + ((chaptersObj[k] && chaptersObj[k].content) || "") + '</section>')
                        .join('\n<hr class="volume-divider" />\n');
                }
            }
        } else {
            const res = await fetchApi(chapterPath.startsWith("http") ? chapterPath : this.site + chapterPath);
            if (res.ok) {
                rawHtml = await res.text();
            }
        }

        return this.sanitizeChapterHtml(rawHtml);
    }

    sanitizeChapterHtml(html) {
        if (!html) return "";
        let cleaned = html.replace(/(<img[^>]+src=["'])(\/assets\/[^"']+)(["'])/gi, "$1" + this.site + "$2$3");
        cleaned = cleaned.replace(/<picture>[\s\S]*?<img([^>]+src=["']https?:\/\/[^"']+["'][^>]*)>[\s\S]*?<\/picture>/gi, "<img$1>");
        return cleaned;
    }
}

exports.default = new CoteReader();
