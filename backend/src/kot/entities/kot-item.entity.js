"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KotItem = void 0;
var typeorm_1 = require("typeorm");
var kot_entity_1 = require("./kot.entity");
var menu_item_entity_1 = require("../../menu/entities/menu-item.entity");
var KotItem = function () {
    var _classDecorators = [(0, typeorm_1.Entity)('kot_items')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _id_decorators;
    var _id_initializers = [];
    var _id_extraInitializers = [];
    var _kot_id_decorators;
    var _kot_id_initializers = [];
    var _kot_id_extraInitializers = [];
    var _menu_item_id_decorators;
    var _menu_item_id_initializers = [];
    var _menu_item_id_extraInitializers = [];
    var _quantity_decorators;
    var _quantity_initializers = [];
    var _quantity_extraInitializers = [];
    var _price_decorators;
    var _price_initializers = [];
    var _price_extraInitializers = [];
    var _kot_decorators;
    var _kot_initializers = [];
    var _kot_extraInitializers = [];
    var _menuItem_decorators;
    var _menuItem_initializers = [];
    var _menuItem_extraInitializers = [];
    var KotItem = _classThis = /** @class */ (function () {
        function KotItem_1() {
            this.id = __runInitializers(this, _id_initializers, void 0);
            this.kot_id = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _kot_id_initializers, void 0));
            this.menu_item_id = (__runInitializers(this, _kot_id_extraInitializers), __runInitializers(this, _menu_item_id_initializers, void 0));
            this.quantity = (__runInitializers(this, _menu_item_id_extraInitializers), __runInitializers(this, _quantity_initializers, void 0));
            this.price = (__runInitializers(this, _quantity_extraInitializers), __runInitializers(this, _price_initializers, void 0));
            this.kot = (__runInitializers(this, _price_extraInitializers), __runInitializers(this, _kot_initializers, void 0));
            this.menuItem = (__runInitializers(this, _kot_extraInitializers), __runInitializers(this, _menuItem_initializers, void 0));
            __runInitializers(this, _menuItem_extraInitializers);
        }
        return KotItem_1;
    }());
    __setFunctionName(_classThis, "KotItem");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [(0, typeorm_1.PrimaryGeneratedColumn)()];
        _kot_id_decorators = [(0, typeorm_1.Column)()];
        _menu_item_id_decorators = [(0, typeorm_1.Column)()];
        _quantity_decorators = [(0, typeorm_1.Column)()];
        _price_decorators = [(0, typeorm_1.Column)('decimal', {
                precision: 10,
                scale: 2,
            })];
        _kot_decorators = [(0, typeorm_1.ManyToOne)(function () { return kot_entity_1.Kot; }, function (kot) { return kot.items; }, {
                onDelete: 'CASCADE',
            }), (0, typeorm_1.JoinColumn)({ name: 'kot_id' })];
        _menuItem_decorators = [(0, typeorm_1.ManyToOne)(function () { return menu_item_entity_1.MenuItem; }), (0, typeorm_1.JoinColumn)({ name: 'menu_item_id' })];
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: function (obj) { return "id" in obj; }, get: function (obj) { return obj.id; }, set: function (obj, value) { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
        __esDecorate(null, null, _kot_id_decorators, { kind: "field", name: "kot_id", static: false, private: false, access: { has: function (obj) { return "kot_id" in obj; }, get: function (obj) { return obj.kot_id; }, set: function (obj, value) { obj.kot_id = value; } }, metadata: _metadata }, _kot_id_initializers, _kot_id_extraInitializers);
        __esDecorate(null, null, _menu_item_id_decorators, { kind: "field", name: "menu_item_id", static: false, private: false, access: { has: function (obj) { return "menu_item_id" in obj; }, get: function (obj) { return obj.menu_item_id; }, set: function (obj, value) { obj.menu_item_id = value; } }, metadata: _metadata }, _menu_item_id_initializers, _menu_item_id_extraInitializers);
        __esDecorate(null, null, _quantity_decorators, { kind: "field", name: "quantity", static: false, private: false, access: { has: function (obj) { return "quantity" in obj; }, get: function (obj) { return obj.quantity; }, set: function (obj, value) { obj.quantity = value; } }, metadata: _metadata }, _quantity_initializers, _quantity_extraInitializers);
        __esDecorate(null, null, _price_decorators, { kind: "field", name: "price", static: false, private: false, access: { has: function (obj) { return "price" in obj; }, get: function (obj) { return obj.price; }, set: function (obj, value) { obj.price = value; } }, metadata: _metadata }, _price_initializers, _price_extraInitializers);
        __esDecorate(null, null, _kot_decorators, { kind: "field", name: "kot", static: false, private: false, access: { has: function (obj) { return "kot" in obj; }, get: function (obj) { return obj.kot; }, set: function (obj, value) { obj.kot = value; } }, metadata: _metadata }, _kot_initializers, _kot_extraInitializers);
        __esDecorate(null, null, _menuItem_decorators, { kind: "field", name: "menuItem", static: false, private: false, access: { has: function (obj) { return "menuItem" in obj; }, get: function (obj) { return obj.menuItem; }, set: function (obj, value) { obj.menuItem = value; } }, metadata: _metadata }, _menuItem_initializers, _menuItem_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        KotItem = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return KotItem = _classThis;
}();
exports.KotItem = KotItem;
