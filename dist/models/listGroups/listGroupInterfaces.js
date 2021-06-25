"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invalidParentVariantError = exports.invalidParentError = exports.invalidGroupVariantError = void 0;
// Base
class invalidGroupVariantError extends Error {
    constructor(variant) {
        super(variant + ' is an invalid groupVariant');
        this.name = 'invalidGroupVariantError';
    }
}
exports.invalidGroupVariantError = invalidGroupVariantError;
class invalidParentError extends Error {
    constructor(parentId) {
        super('unable to find a parent group with id of ' +
            parentId +
            'on which the user is authorised to create child groups.');
        this.name = 'invalidParentError';
    }
}
exports.invalidParentError = invalidParentError;
class invalidParentVariantError extends Error {
    constructor(childVariant, parentVariant) {
        super(childVariant + ' is an invalid child for the provided parent variant' + parentVariant);
        this.name = 'invalidParentVariantError';
    }
}
exports.invalidParentVariantError = invalidParentVariantError;
