const TOKEN_KEY = 'kc_token';
const DEMO_KEY = 'kc_is_demo';

function readToken(): string | null {
	if (typeof sessionStorage === 'undefined') return null;
	return sessionStorage.getItem(TOKEN_KEY);
}

function readIsDemo(): boolean {
	if (typeof sessionStorage === 'undefined') return false;
	return sessionStorage.getItem(DEMO_KEY) === 'true';
}

class AuthState {
	token = $state<string | null>(readToken());
	isDemo = $state<boolean>(readIsDemo());

	get isAuthenticated() {
		return this.token !== null;
	}

	setSession(token: string, isDemo: boolean) {
		this.token = token;
		this.isDemo = isDemo;
		sessionStorage.setItem(TOKEN_KEY, token);
		if (isDemo) {
			sessionStorage.setItem(DEMO_KEY, 'true');
		} else {
			sessionStorage.removeItem(DEMO_KEY);
		}
	}

	clearSession() {
		this.token = null;
		this.isDemo = false;
		sessionStorage.removeItem(TOKEN_KEY);
		sessionStorage.removeItem(DEMO_KEY);
	}
}

export const auth = new AuthState();
