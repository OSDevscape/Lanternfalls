import { WebPlugin } from '@capacitor/core';
import { AppleSocialLogin } from './apple-provider';
import { FacebookSocialLogin } from './facebook-provider';
import { GoogleSocialLogin } from './google-provider';
export class SocialLoginWeb extends WebPlugin {
    constructor() {
        var _a;
        super();
        this.googleProvider = new GoogleSocialLogin();
        this.appleProvider = new AppleSocialLogin();
        this.facebookProvider = new FacebookSocialLogin();
        // Set up listener for OAuth redirects if we have a pending OAuth flow
        if (localStorage.getItem(SocialLoginWeb.OAUTH_STATE_KEY)) {
            console.log('OAUTH_STATE_KEY found');
            const result = this.handleOAuthRedirect();
            if (result) {
                (_a = window.opener) === null || _a === void 0 ? void 0 : _a.postMessage(Object.assign({ type: 'oauth-response' }, result.result), window.location.origin);
                window.close();
            }
        }
    }
    handleOAuthRedirect() {
        const url = new URL(window.location.href);
        return this.googleProvider.handleOAuthRedirect(url);
    }
    async initialize(options) {
        var _a, _b, _c;
        const initPromises = [];
        if ((_a = options.google) === null || _a === void 0 ? void 0 : _a.webClientId) {
            initPromises.push(this.googleProvider.initialize(options.google.webClientId, options.google.mode, options.google.hostedDomain));
        }
        if ((_b = options.apple) === null || _b === void 0 ? void 0 : _b.clientId) {
            initPromises.push(this.appleProvider.initialize(options.apple.clientId, options.apple.redirectUrl));
        }
        if ((_c = options.facebook) === null || _c === void 0 ? void 0 : _c.appId) {
            initPromises.push(this.facebookProvider.initialize(options.facebook.appId));
        }
        await Promise.all(initPromises);
    }
    async login(options) {
        switch (options.provider) {
            case 'google':
                return this.googleProvider.login(options.options);
            case 'apple':
                return this.appleProvider.login(options.options);
            case 'facebook':
                return this.facebookProvider.login(options.options);
            default:
                throw new Error(`Login for ${options.provider} is not implemented on web`);
        }
    }
    async logout(options) {
        switch (options.provider) {
            case 'google':
                return this.googleProvider.logout();
            case 'apple':
                return this.appleProvider.logout();
            case 'facebook':
                return this.facebookProvider.logout();
            default:
                throw new Error(`Logout for ${options.provider} is not implemented`);
        }
    }
    async isLoggedIn(options) {
        switch (options.provider) {
            case 'google':
                return this.googleProvider.isLoggedIn();
            case 'apple':
                return this.appleProvider.isLoggedIn();
            case 'facebook':
                return this.facebookProvider.isLoggedIn();
            default:
                throw new Error(`isLoggedIn for ${options.provider} is not implemented`);
        }
    }
    async getAuthorizationCode(options) {
        switch (options.provider) {
            case 'google':
                return this.googleProvider.getAuthorizationCode();
            case 'apple':
                return this.appleProvider.getAuthorizationCode();
            case 'facebook':
                return this.facebookProvider.getAuthorizationCode();
            default:
                throw new Error(`getAuthorizationCode for ${options.provider} is not implemented`);
        }
    }
    async refresh(options) {
        switch (options.provider) {
            case 'google':
                return this.googleProvider.refresh();
            case 'apple':
                return this.appleProvider.refresh();
            case 'facebook':
                return this.facebookProvider.refresh(options.options);
            default:
                throw new Error(`Refresh for ${options.provider} is not implemented`);
        }
    }
}
SocialLoginWeb.OAUTH_STATE_KEY = 'social_login_oauth_pending';
//# sourceMappingURL=web.js.map