import { Message } from '../models/message';

export function isStringPalindrome(content: string) {
    if (content.length === 0) {
        return false;
    }
    const limit = Math.floor(content.length / 2);
    for (let i = 0; i < limit; i++) {
        if (content.charAt(i) !== content.charAt(content.length - 1 - i)) {
            return false;
        }
    }
    return true;
}

export function isPalindrome(message: Message) {
    return isStringPalindrome(message.content);
}
