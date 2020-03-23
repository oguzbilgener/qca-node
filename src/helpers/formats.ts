export function formatDate(date: Date) {
    return date.toISOString();
}

export function isValidObjectId(input: string) {
    return /^[0-9a-fA-F]{24}$/.test(input);
}

export const customFormatValidators = {
    ObjectId: isValidObjectId,
};
