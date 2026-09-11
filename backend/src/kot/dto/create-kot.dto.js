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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateKotDto = void 0;
var class_validator_1 = require("class-validator");
var class_transformer_1 = require("class-transformer");
var KotItemDto = function () {
    var _a;
    var _menu_item_id_decorators;
    var _menu_item_id_initializers = [];
    var _menu_item_id_extraInitializers = [];
    var _quantity_decorators;
    var _quantity_initializers = [];
    var _quantity_extraInitializers = [];
    return _a = /** @class */ (function () {
            function KotItemDto() {
                this.menu_item_id = __runInitializers(this, _menu_item_id_initializers, void 0);
                this.quantity = (__runInitializers(this, _menu_item_id_extraInitializers), __runInitializers(this, _quantity_initializers, void 0));
                __runInitializers(this, _quantity_extraInitializers);
            }
            return KotItemDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _menu_item_id_decorators = [(0, class_validator_1.IsInt)()];
            _quantity_decorators = [(0, class_validator_1.IsInt)()];
            __esDecorate(null, null, _menu_item_id_decorators, { kind: "field", name: "menu_item_id", static: false, private: false, access: { has: function (obj) { return "menu_item_id" in obj; }, get: function (obj) { return obj.menu_item_id; }, set: function (obj, value) { obj.menu_item_id = value; } }, metadata: _metadata }, _menu_item_id_initializers, _menu_item_id_extraInitializers);
            __esDecorate(null, null, _quantity_decorators, { kind: "field", name: "quantity", static: false, private: false, access: { has: function (obj) { return "quantity" in obj; }, get: function (obj) { return obj.quantity; }, set: function (obj, value) { obj.quantity = value; } }, metadata: _metadata }, _quantity_initializers, _quantity_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
var CreateKotDto = function () {
    var _a;
    var _table_no_decorators;
    var _table_no_initializers = [];
    var _table_no_extraInitializers = [];
    var _items_decorators;
    var _items_initializers = [];
    var _items_extraInitializers = [];
    return _a = /** @class */ (function () {
            function CreateKotDto() {
                this.table_no = __runInitializers(this, _table_no_initializers, void 0);
                this.items = (__runInitializers(this, _table_no_extraInitializers), __runInitializers(this, _items_initializers, void 0));
                __runInitializers(this, _items_extraInitializers);
            }
            return CreateKotDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _table_no_decorators = [(0, class_validator_1.IsInt)()];
            _items_decorators = [(0, class_validator_1.IsArray)(), (0, class_validator_1.IsNotEmpty)(), (0, class_validator_1.ValidateNested)({ each: true }), (0, class_transformer_1.Type)(function () { return KotItemDto; })];
            __esDecorate(null, null, _table_no_decorators, { kind: "field", name: "table_no", static: false, private: false, access: { has: function (obj) { return "table_no" in obj; }, get: function (obj) { return obj.table_no; }, set: function (obj, value) { obj.table_no = value; } }, metadata: _metadata }, _table_no_initializers, _table_no_extraInitializers);
            __esDecorate(null, null, _items_decorators, { kind: "field", name: "items", static: false, private: false, access: { has: function (obj) { return "items" in obj; }, get: function (obj) { return obj.items; }, set: function (obj, value) { obj.items = value; } }, metadata: _metadata }, _items_initializers, _items_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.CreateKotDto = CreateKotDto;
