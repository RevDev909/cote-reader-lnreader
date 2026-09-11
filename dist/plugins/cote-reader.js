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

// Safe imports with fallbacks
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
        this.id = "cote-reader";
        this.name = "COTE Reader";
        this.site = "https://cote-reader.me";
        this.icon = "src/en/cotereader/icon.png";
        this.version = "1.0.0";
        this.novelCache = new Map();
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
            var url, filters, res, data, items, self;
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
                        self = this;
                        return [2 /*return*/, items.map(function (novel) {
                            return {
                                name: novel.title,
                                path: "/novel/" + novel.id,
                                cover: self.formatCover(novel.cover)
                            };
                        })];
                }
            });
        });
    };

    CoteReader.prototype.searchNovels = function (searchTerm, pageNo) {
        return __awaiter(this, void 0, void 0, function () {
            var url, res, data, items, self;
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
                        self = this;
                        return [2 /*return*/, items.map(function (novel) {
                            return {
                                name: novel.title,
                                path: "/novel/" + novel.id,
                                cover: self.formatCover(novel.cover)
                            };
                        })];
                }
            });
        });
    };

    CoteReader.prototype.parseNovel = function (novelPath) {
        return __awaiter(this, void 0, void 0, function () {
            var id, metaUrl, res, data, volumes, totalPages, initialChapters, firstPage, genres;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        id = this.cleanId(novelPath);
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
                        this.novelCache.set(id, data);
                        volumes = data.volumes || [];
                        totalPages = Math.max(1, volumes.length);
                        initialChapters = [];
                        if (!(totalPages > 0)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.parsePage(novelPath, "1")];
                    case 3:
                        firstPage = _a.sent();
                        initialChapters = firstPage.chapters;
                        _a.label = 4;
                    case 4:
                        genres = Array.isArray(data.tags)
                            ? data.tags.join(", ")
                            : Array.isArray(data.genres)
                                ? data.genres.join(", ")
                                : undefined;
                        return [2 /*return*/, {
                            path: "/novel/" + (data.id || id),
                            name: data.title,
                            cover: this.formatCover(data.cover),
                            summary: data.description,
                            author: data.author,
                            genres: genres,
                            status: NovelStatus.Ongoing,
                            totalPages: totalPages,
                            chapters: initialChapters
                        }];
                }
            });
        });
    };

    CoteReader.prototype.parsePage = function (novelPath, page) {
        return __awaiter(this, void 0, void 0, function () {
            var id, novelMeta, res, volumes, pageNum, volIndex, volume, chapters, isCanonical, cacheUrl, res_1, json, keys, _i, keys_1, key, item, volApiUrl, res_2, volData, toc, _a, toc_1, item;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        id = this.cleanId(novelPath);
                        novelMeta = this.novelCache.get(id);
                        if (!!novelMeta) return [3 /*break*/, 3];
                        return [4 /*yield*/, fetchApi(this.site + "/api/novels/" + id)];
                    case 1:
                        res = _b.sent();
                        if (!res.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, res.json()];
                    case 2:
                        novelMeta = _b.sent();
                        this.novelCache.set(id, novelMeta);
                        _b.label = 3;
                    case 3:
                        volumes = (novelMeta && novelMeta.volumes) || [];
                        pageNum = parseInt(page, 10);
                        volIndex = isNaN(pageNum) || pageNum < 1 ? 0 : pageNum - 1;
                        volume = volumes[volIndex];
                        if (!volume) {
                            return [2 /*return*/, { chapters: [] }];
                        }
                        chapters = [];
                        isCanonical = this.canonicalIds.has(id.toLowerCase());
                        if (!isCanonical) return [3 /*break*/, 6];
                        cacheUrl = this.site + "/assets/cache/" + id + "/" + volume.id + ".json";
                        return [4 /*yield*/, fetchApi(cacheUrl)];
                    case 4:
                        res_1 = _b.sent();
                        if (!res_1.ok) return [3 /*break*/, 6];
                        return [4 /*yield*/, res_1.json()];
                    case 5:
                        json = _b.sent();
                        keys = Object.keys(json).sort(function (a, b) { return Number(a) - Number(b); });
                        for (_i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
                            key = keys_1[_i];
                            item = json[key];
                            chapters.push({
                                name: volume.title + " - " + (item.title || "Chapter " + key),
                                path: "/canonical/" + id + "/" + volume.id + "/" + key,
                                chapterNumber: Number(key)
                            });
                        }
                        return [2 /*return*/, { chapters: chapters }];
                    case 6:
                        volApiUrl = this.site + "/api/novels/" + id + "/volume/" + volume.id;
                        return [4 /*yield*/, fetchApi(volApiUrl)];
                    case 7:
                        res_2 = _b.sent();
                        if (!res_2.ok) return [3 /*break*/, 9];
                        return [4 /*yield*/, res_2.json()];
                    case 8:
                        volData = _b.sent();
                        toc = volData.toc || [];
                        for (_a = 0, toc_1 = toc; _a < toc_1.length; _a++) {
                            item = toc_1[_a];
                            chapters.push({
                                name: volume.title + " - " + item.title,
                                path: "/api/novels/" + id + "/volume/" + volume.id + "/" + item.chapterIndex,
                                chapterNumber: item.chapterIndex
                            });
                        }
                        _b.label = 9;
                    case 9:
                        return [2 /*return*/, { chapters: chapters }];
                }
            });
        });
    };

    CoteReader.prototype.parseChapter = function (chapterPath) {
        return __awaiter(this, void 0, void 0, function () {
            var rawHtml, parts, id, volumeId, chapterKey, cacheUrl, res, json, parts, id, volumeId, chapterIndex, volUrl, res, volData, res;
            var _a;
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
                            throw new Error("Failed to fetch chapter: HTTP " + res.status);
                        }
                        return [4 /*yield*/, res.json()];
                    case 2:
                        json = _b.sent();
                        rawHtml = (json[chapterKey] && json[chapterKey].content) || "";
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
                        if (!res.ok) {
                            throw new Error("Failed to fetch chapter: HTTP " + res.status);
                        }
                        return [4 /*yield*/, res.json()];
                    case 5:
                        volData = _b.sent();
                        rawHtml = (((_a = volData.chapters) === null || _a === void 0 ? void 0 : _a[chapterIndex]) && volData.chapters[chapterIndex].content) || "";
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

// Generator helper polyfill
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
