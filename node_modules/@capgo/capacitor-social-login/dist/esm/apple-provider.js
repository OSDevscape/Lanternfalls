import { BaseSocialLogin } from './base';
export class AppleSocialLogin extends BaseSocialLogin {
    constructor() {
        super(...arguments);
        this.clientId = null;
        this.redirectUrl = null;
        this.scriptLoaded = false;
        this.scriptUrl = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
    }
    async initialize(clientId, redirectUrl) {
        this.clientId = clientId;
        this.redirectUrl = redirectUrl || null;
        if (clientId) {
            await this.loadAppleScript();
        }
    }
    async login(options) {
        if (!this.clientId) {
            throw new Error('Apple Client ID not set. Call initialize() first.');
        }
        if (!this.scriptLoaded) {
            throw new Error('Apple Sign-In script not loaded.');
        }
        return new Promise((resolve, reject) => {
            var _a;
            AppleID.auth.init({
                clientId: this.clientId,
                scope: ((_a = options.scopes) === null || _a === void 0 ? void 0 : _a.join(' ')) || 'name email',
                redirectURI: this.redirectUrl || window.location.href,
                state: options.state,
                nonce: options.nonce,
                usePopup: true,
            });
            AppleID.auth
                .signIn()
                .then((res) => {
                var _a, _b, _c, _d, _e;
                const result = {
                    profile: {
                        user: res.user || '',
                        email: ((_a = res.user) === null || _a === void 0 ? void 0 : _a.email) || null,
                        givenName: ((_c = (_b = res.user) === null || _b === void 0 ? void 0 : _b.name) === null || _c === void 0 ? void 0 : _c.firstName) || null,
                        familyName: ((_e = (_d = res.user) === null || _d === void 0 ? void 0 : _d.name) === null || _e === void 0 ? void 0 : _e.lastName) || null,
                    },
                    accessToken: {
                        token: res.authorization.id_token || '',
                    },
                    idToken: res.authorization.code || null,
                };
                resolve({ provider: 'apple', result });
            })
                .catch((error) => {
                reject(error);
            });
        });
    }
    async logout() {
        // Apple doesn't provide a logout method for web
        console.log('Apple logout: Session should be managed on the client side');
    }
    async isLoggedIn() {
        // Apple doesn't provide a method to check login status on web
        console.log('Apple login status should be managed on the client side');
        return { isLoggedIn: false };
    }
    async getAuthorizationCode() {
        // Apple authorization code should be obtained during login
        console.log('Apple authorization code should be stored during login');
        throw new Error('Apple authorization code not available');
    }
    async refresh() {
        // Apple doesn't provide a refresh method for web
        console.log('Apple refresh not available on web');
    }
    async loadAppleScript() {
        if (this.scriptLoaded)
            return;
        return this.loadScript(this.scriptUrl).then(() => {
            this.scriptLoaded = true;
        });
    }
}
//# sourceMappingURL=apple-provider.js.map