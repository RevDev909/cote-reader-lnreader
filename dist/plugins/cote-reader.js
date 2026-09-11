"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};

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

var CoteReader = /** @class */ (function () {
    function CoteReader() {
        this.id = "cotereader";
        this.name = "COTE Reader";
        this.site = "https://cote-reader.me";
        this.icon = "src/en/cotereader/icon.png";
        this.version = "1.0.4";
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

    CoteReader.prototype.formatCover = function (cover) {
        if (!cover) return defaultCover;
        if (cover.startsWith("http://") || cover.startsWith("https://")) return cover;
        if (cover.startsWith("/")) return "" + this.site + cover;
        return this.site + "/" + cover;
    };

    CoteReader.prototype.cleanId = function (novelPath) {
        return novelPath
            .replace(/^\/?novel\//i, "")
            .replace(/^\//, "")
            .split("/")[0]
            .trim();
    };

    CoteReader.prototype.popularNovels = function (pageNo, options) {
        return __awaiter(this, void 0, void 0, function () {
            var url, filters, res, data, items, seenPaths, seenTitles, result, self, _i, items_1, novel, targetId, path, normTitle;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        url = this.site + "/api/novels?page=" + pageNo + "&limit=20";
                        filters = options && options.filters;
                        if (filters && filters.tag && filters.tag.value) {
                            url += "&tag=" + encodeURIComponent(filters.tag.value);
                        }
                        return [4 /*yield*/, fetchApi(url)];
                    case 1:
                        res = _a.sent();
                        if (!res.ok) {
                            throw new Error("Failed to load popular novels: HTTP " + res.status);
                        }
                        return [4 /*yield*/, res.json()];
                    case 2:
                        data = _a.sent();
                        items = data.items || [];
                        seenPaths = new Set();
                        seenTitles = new Set();
                        result = [];
                        self = this;
                        for (_i = 0, items_1 = items; _i < items_1.length; _i++) {
                            novel = items_1[_i];
                            targetId = self.aliasMap[novel.id] || novel.id;
                            path = "/novel/" + targetId;
                            normTitle = novel.title.toLowerCase().replace(/[^a-z0-9]/g, "");
                            if (seenPaths.has(path) || seenTitles.has(normTitle)) {
                                continue;
                            }
                            seenPaths.add(path);
                            seenTitles.add(normTitle);
                            result.push({
                                name: novel.title,
                                path: path,
                                cover: self.formatCover(novel.cover)
                            });
                        }
                        return [2 /*return*/, result];
                }
            });
        });
    };

    CoteReader.prototype.searchNovels = function (searchTerm, pageNo) {
        return __awaiter(this, void 0, void 0, function () {
            var url, res, data, items, seenPaths, seenTitles, result, self, _i, items_2, novel, targetId, path, normTitle;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        url = this.site + "/api/novels?q=" + encodeURIComponent(searchTerm) + "&page=" + pageNo + "&limit=20";
                        return [4 /*yield*/, fetchApi(url)];
                    case 1:
                        res = _a.sent();
                        if (!res.ok) {
                            throw new Error("Failed to search novels: HTTP " + res.status);
                        }
                        return [4 /*yield*/, res.json()];
                    case 2:
                        data = _a.sent();
                        items = data.items || [];
                        seenPaths = new Set();
                        seenTitles = new Set();
                        result = [];
                        self = this;
                        for (_i = 0, items_2 = items; _i < items_2.length; _i++) {
                            novel = items_2[_i];
                            targetId = self.aliasMap[novel.id] || novel.id;
                            path = "/novel/" + targetId;
                            normTitle = novel.title.toLowerCase().replace(/[^a-z0-9]/g, "");
                            if (seenPaths.has(path) || seenTitles.has(normTitle)) {
                                continue;
                            }
                            seenPaths.add(path);
                            seenTitles.add(normTitle);
                            result.push({
                                name: novel.title,
                                path: path,
                                cover: self.formatCover(novel.cover)
                            });
                        }
                        return [2 /*return*/, result];
                }
            });
        });
    };

    CoteReader.prototype.parseNovel = function (novelPath) {
        return __awaiter(this, void 0, void 0, function () {
            var rawId, id, metaUrl, res, data, volumes, isCanonical, chapters, genres;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        rawId = this.cleanId(novelPath);
                        id = this.aliasMap[rawId] || rawId;
                        metaUrl = this.site + "/api/novels/" + id;
                        return [4 /*yield*/, fetchApi(metaUrl)];
                    case 1:
                        res = _a.sent();
                        if (!res.ok) {
                            throw new Error("Failed to load novel metadata: HTTP " + res.status);
                        }
                        return [4 /*yield*/, res.json()];
                    case 2:
                        data = _a.sent();
                        volumes = data.volumes || [];
                        isCanonical = this.canonicalIds.has(id.toLowerCase());
                        chapters = volumes.map(function (volume, index) {
                            var position = index + 1;
                            var numStr = String(position).padStart(2, "0");
                            var rawTitle = volume.title || ("Volume " + position);
                            var name = "Vol. " + numStr + ": " + rawTitle;
                            var path = isCanonical
                                ? "/canonical/" + id + "/" + volume.id
                                : "/api/novels/" + id + "/volume/" + volume.id;
                            return {
                                name: name,
                                path: path,
                                chapterNumber: position
                            };
                        });
                        genres = Array.isArray(data.tags)
                            ? data.tags.join(", ")
                            : Array.isArray(data.genres)
                                ? data.genres.join(", ")
                                : undefined;
                        return [2 /*return*/, {
                            path: novelPath,
                            name: data.title,
                            cover: this.formatCover(data.cover),
                            summary: data.description,
                            author: data.author,
                            genres: genres,
                            status: NovelStatus.Ongoing,
                            chapters: chapters
                        }];
                }
            });
        });
    };

    CoteReader.prototype.parseChapter = function (chapterPath) {
        return __awaiter(this, void 0, void 0, function () {
            var rawHtml, parts, id, volumeId, chapterKey, cacheUrl, res, json, keys, parts, id, volumeId, chapterIndex, volUrl, res, volData, chaptersObj, toc, keys, res;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        rawHtml = "";
                        if (!chapterPath.startsWith("/canonical/")) return [3 /*break*/, 3];
                        parts = chapterPath.replace(/^\/canonical\//, "").split("/");
                        id = parts[0];
                        volumeId = parts[1];
                        chapterKey = parts[2];
                        cacheUrl = this.site + "/assets/cache/" + id + "/" + volumeId + ".json";
                        return [4 /*yield*/, fetchApi(cacheUrl)];
                    case 1:
                        res = _b.sent();
                        if (!res.ok) {
                            throw new Error("Failed to fetch volume: HTTP " + res.status);
                        }
                        return [4 /*yield*/, res.json()];
                    case 2:
                        json = _b.sent();
                        if (chapterKey && json[chapterKey]) {
                            rawHtml = json[chapterKey].content || "";
                        } else {
                            keys = Object.keys(json).sort(function (a, b) { return Number(a) - Number(b); });
                            rawHtml = keys
                                .map(function (k) {
                                    var item = json[k];
                                    var title = item.title || ("Chapter " + k);
                                    return '<section class="volume-chapter"><h2 class="volume-chapter-title">' + title + '</h2>' + (item.content || "") + '</section>';
                                })
                                .join('\n<hr class="volume-divider" />\n');
                        }
                        return [3 /*break*/, 9];
                    case 3:
                        if (!chapterPath.startsWith("/api/novels/")) return [3 /*break*/, 6];
                        parts = chapterPath.replace(/^\/api\/novels\//, "").split("/");
                        id = parts[0];
                        volumeId = parts[2];
                        chapterIndex = parts[3];
                        volUrl = this.site + "/api/novels/" + id + "/volume/" + volumeId;
                        return [4 /*yield*/, fetchApi(volUrl)];
                    case 4:
                        res = _b.sent();
                        if (!(res.status === 503)) return [3 /*break*/, 7];
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                    case 5:
                        _b.sent();
                        return [4 /*yield*/, fetchApi(volUrl)];
                    case 6:
                        res = _b.sent();
                        _b.label = 7;
                    case 7:
                        if (!res.ok) {
                            if (res.status === 503) {
                                throw new Error("Remote server is busy (HTTP 503: Cloudflare Worker limit). Please retry in a moment.");
                            }
                            throw new Error("Failed to fetch volume: HTTP " + res.status);
                        }
                        return [4 /*yield*/, res.json()];
                    case 8:
                        volData = _b.sent();
                        if (chapterIndex && volData.chapters && volData.chapters[chapterIndex]) {
                            rawHtml = volData.chapters[chapterIndex].content || "";
                        } else {
                            chaptersObj = volData.chapters || {};
                            toc = volData.toc || [];
                            if (toc.length > 0) {
                                rawHtml = toc
                                    .map(function (item) {
                                        var ch = chaptersObj[item.chapterIndex];
                                        return '<section class="volume-chapter"><h2 class="volume-chapter-title">' + item.title + '</h2>' + ((ch && ch.content) || "") + '</section>';
                                    })
                                    .join('\n<hr class="volume-divider" />\n');
                            } else {
                                keys = Object.keys(chaptersObj).sort(function (a, b) { return Number(a) - Number(b); });
                                rawHtml = keys
                                    .map(function (k) {
                                        var ch = chaptersObj[k];
                                        return '<section class="volume-chapter">' + ((ch && ch.content) || "") + '</section>';
                                    })
                                    .join('\n<hr class="volume-divider" />\n');
                            }
                        }
                        return [3 /*break*/, 9];
                    case 6:
                        return [4 /*yield*/, fetchApi(chapterPath.startsWith("http") ? chapterPath : "" + this.site + chapterPath)];
                    case 7:
                        res = _b.sent();
                        if (!res.ok) return [3 /*break*/, 9];
                        return [4 /*yield*/, res.text()];
                    case 8:
                        rawHtml = _b.sent();
                        _b.label = 9;
                    case 9:
                        return [2 /*return*/, this.sanitizeChapterHtml(rawHtml)];
                }
            });
        });
    };

    CoteReader.prototype.sanitizeChapterHtml = function (html) {
        if (!html) return "";
        var cleaned = html.replace(/(<img[^>]+src=["'])(\/assets\/[^"']+)(["'])/gi, "$1" + this.site + "$2$3");
        cleaned = cleaned.replace(/<picture>[\s\S]*?<img([^>]+src=["']https?:\/\/[^"']+["'][^>]*)>[\s\S]*?<\/picture>/gi, "<img$1>");
        return cleaned;
    };

    return CoteReader;
}());

var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};

var pluginInstance = new CoteReader();
exports.default = pluginInstance;
