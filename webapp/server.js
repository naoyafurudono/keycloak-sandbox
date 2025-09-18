const express = require('express');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24
  }
}));

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const keycloakConfig = {
  realm: process.env.KEYCLOAK_REALM || 'demo',
  'auth-server-url': process.env.KEYCLOAK_URL || 'http://localhost:8080',
  'ssl-required': 'none',
  resource: process.env.KEYCLOAK_CLIENT_ID || 'webapp',
  'public-client': false,
  credentials: {
    secret: process.env.KEYCLOAK_CLIENT_SECRET || 'secret'
  }
};

const checkAuth = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.redirect('/login');
  }
};

app.get('/', (req, res) => {
  res.render('index', { user: req.session.user });
});

app.get('/login', (req, res) => {
  const keycloakUrl = `${keycloakConfig['auth-server-url']}/realms/${keycloakConfig.realm}/protocol/openid-connect/auth`;
  const clientId = keycloakConfig.resource;
  const redirectUri = encodeURIComponent(`${process.env.APP_URL || 'http://localhost:3000'}/callback`);
  const responseType = 'code';
  const scope = 'openid profile email';

  const authUrl = `${keycloakUrl}?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=${responseType}&scope=${scope}`;

  res.redirect(authUrl);
});

app.get('/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.redirect('/');
  }

  try {
    const tokenUrl = `${keycloakConfig['auth-server-url']}/realms/${keycloakConfig.realm}/protocol/openid-connect/token`;

    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('client_id', keycloakConfig.resource);
    params.append('client_secret', keycloakConfig.credentials.secret);
    params.append('code', code);
    params.append('redirect_uri', `${process.env.APP_URL || 'http://localhost:3000'}/callback`);

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params
    });

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', await tokenResponse.text());
      return res.redirect('/');
    }

    const tokens = await tokenResponse.json();

    const userInfoUrl = `${keycloakConfig['auth-server-url']}/realms/${keycloakConfig.realm}/protocol/openid-connect/userinfo`;
    const userInfoResponse = await fetch(userInfoUrl, {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`
      }
    });

    if (!userInfoResponse.ok) {
      console.error('Failed to fetch user info:', await userInfoResponse.text());
      return res.redirect('/');
    }

    const userInfo = await userInfoResponse.json();

    req.session.user = {
      ...userInfo,
      accessToken: tokens.access_token,
      idToken: tokens.id_token,
      refreshToken: tokens.refresh_token
    };

    res.redirect('/profile');
  } catch (error) {
    console.error('Authentication error:', error);
    res.redirect('/');
  }
});

app.get('/profile', checkAuth, (req, res) => {
  res.render('profile', { user: req.session.user });
});

app.get('/logout', (req, res) => {
  const idToken = req.session.user?.idToken;
  req.session.destroy();

  if (idToken) {
    const logoutUrl = `${keycloakConfig['auth-server-url']}/realms/${keycloakConfig.realm}/protocol/openid-connect/logout`;
    const postLogoutRedirectUri = encodeURIComponent(process.env.APP_URL || 'http://localhost:3000');
    const fullLogoutUrl = `${logoutUrl}?id_token_hint=${idToken}&post_logout_redirect_uri=${postLogoutRedirectUri}`;
    res.redirect(fullLogoutUrl);
  } else {
    res.redirect('/');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log('Keycloak configuration:', {
    realm: keycloakConfig.realm,
    authServerUrl: keycloakConfig['auth-server-url'],
    clientId: keycloakConfig.resource
  });
});
