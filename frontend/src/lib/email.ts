export function getEmailUsername(email: string | undefined | null): string {
    if (!email) {
        return '';
    }

    const atIndex = email.indexOf('@');

    if (atIndex === -1) {
        return email;
    }

    return email.slice(0, atIndex);
}
