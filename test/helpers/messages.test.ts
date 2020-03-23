import { isStringPalindrome, isPalindrome } from '../../src/helpers/messages';

describe('isStringPalindrome', () => {
    test('does not consider an empty string as palindrome', () => {
        expect(isStringPalindrome('')).toBe(false);
    });

    test('considers a single character as a palindrome', () => {
        expect(isStringPalindrome('a')).toBe(true);
        expect(isStringPalindrome('I')).toBe(true);
    });

    test('considers "abc" as non-palindrome', () => {
        expect(isStringPalindrome('abc')).toBe(false);
    });

    test('considers "abba" and "racecar" as palindromes', () => {
        expect(isStringPalindrome('abba')).toBe(true);
        expect(isStringPalindrome('racecar')).toBe(true);
    });

    test('does not consider "nope" as a palindrome', () => {
        expect(isStringPalindrome('nope')).toBe(false);
    });

    test('consider a word that means "a knock on the door" palindrome', () => {
        expect(isStringPalindrome('tattarrattat')).toBe(true);
    });

    test('is case sensitive', () => {
        expect(isStringPalindrome('abXBa')).toBe(false);
    });

    test('does not consider a multi-word input with spaces in wrong places as palindrome', () => {
        const input = 'was it a cat i saw';
        expect(isStringPalindrome(input.replace(/ /g, ''))).toBe(true);
        expect(isStringPalindrome(input)).toBe(false);
    });
});

describe('isPalindrome', () => {
    test('does not consider an empty message as palindrome', () => {
        expect(
            isPalindrome({
                content: '',
                createdAt: new Date(),
            })
        ).toBe(false);
    });
    test('considers a message as a palindrome', () => {
        expect(
            isPalindrome({
                content: 'saippuakivikauppias',
                createdAt: new Date(),
            })
        ).toBe(true);
    });
});
