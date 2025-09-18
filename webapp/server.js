const express = require("express");
const session = require("express-session");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const APP_NAME = process.env.APP_NAME || "アプリ1";
const APP_COLOR = process.env.APP_COLOR || "#667eea";

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-session-secret",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24,
    },
  }),
);

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// TODOルートを追加
const todosRouter = require("./routes/todos");
app.use(todosRouter);

const keycloakConfig = {
  realm: process.env.KEYCLOAK_REALM || "demo",
  "auth-server-url": process.env.KEYCLOAK_URL || "http://localhost:8080",
  "ssl-required": "none",
  resource: process.env.KEYCLOAK_CLIENT_ID || "webapp",
  "public-client": false,
  credentials: {
    secret: process.env.KEYCLOAK_CLIENT_SECRET || "secret",
  },
};

const checkAuth = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.redirect("/login");
  }
};

app.get("/", (req, res) => {
  res.render("index", {
    user: req.session.user,
    appName: APP_NAME,
    appColor: APP_COLOR,
    appPort: PORT,
  });
});

// TODO画面
app.get("/todos", checkAuth, (req, res) => {
  res.render("todos", {
    user: req.session.user,
    appName: APP_NAME,
    appColor: APP_COLOR,
  });
});

app.get("/login", (req, res) => {
  // ブラウザからアクセス可能なURLを使用
  const browserKeycloakUrl = "http://localhost:8080";
  const keycloakUrl = `${browserKeycloakUrl}/realms/${keycloakConfig.realm}/protocol/openid-connect/auth`;
  const clientId = keycloakConfig.resource;
  const redirectUri = encodeURIComponent(`${process.env.APP_URL || "http://localhost:3000"}/callback`);
  const responseType = "code";
  const scope = "openid profile email";

  const authUrl = `${keycloakUrl}?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=${responseType}&scope=${scope}`;

  res.redirect(authUrl);
});

app.get("/signup", (req, res) => {
  // ログイン済みの場合、まず現在のセッションからログアウト
  if (req.session.user) {
    const idToken = req.session.user?.idToken;
    req.session.destroy((err) => {
      if (!err && idToken) {
        // Keycloakからもログアウトしてから登録ページへ
        const browserKeycloakUrl = "http://localhost:8080";
        const logoutUrl = `${browserKeycloakUrl}/realms/${keycloakConfig.realm}/protocol/openid-connect/logout`;
        const registrationUrl = `${browserKeycloakUrl}/realms/${keycloakConfig.realm}/protocol/openid-connect/registrations`;
        const clientId = keycloakConfig.resource;
        const redirectUri = encodeURIComponent(`${process.env.APP_URL || "http://localhost:3000"}/callback`);
        const signupRedirect = encodeURIComponent(
          `${registrationUrl}?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid profile email`,
        );
        const fullLogoutUrl = `${logoutUrl}?id_token_hint=${idToken}&post_logout_redirect_uri=${signupRedirect}`;
        return res.redirect(fullLogoutUrl);
      }
    });
  } else {
    // 未ログインの場合は直接登録ページへ
    const browserKeycloakUrl = "http://localhost:8080";
    const registrationUrl = `${browserKeycloakUrl}/realms/${keycloakConfig.realm}/protocol/openid-connect/registrations`;
    const clientId = keycloakConfig.resource;
    const redirectUri = encodeURIComponent(`${process.env.APP_URL || "http://localhost:3000"}/callback`);
    const responseType = "code";
    const scope = "openid profile email";

    const signupUrl = `${registrationUrl}?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=${responseType}&scope=${scope}`;

    res.redirect(signupUrl);
  }
});

app.get("/callback", async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.redirect("/");
  }

  try {
    // サーバーサイドからはコンテナ名でアクセス
    const tokenUrl = `${keycloakConfig["auth-server-url"]}/realms/${keycloakConfig.realm}/protocol/openid-connect/token`;

    const params = new URLSearchParams();
    params.append("grant_type", "authorization_code");
    params.append("client_id", keycloakConfig.resource);
    params.append("client_secret", keycloakConfig.credentials.secret);
    params.append("code", code);
    params.append("redirect_uri", `${process.env.APP_URL || "http://localhost:3000"}/callback`);

    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    if (!tokenResponse.ok) {
      console.error("Token exchange failed:", await tokenResponse.text());
      return res.redirect("/");
    }

    const tokens = await tokenResponse.json();

    const userInfoUrl = `${keycloakConfig["auth-server-url"]}/realms/${keycloakConfig.realm}/protocol/openid-connect/userinfo`;
    const userInfoResponse = await fetch(userInfoUrl, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      console.error("Failed to fetch user info:", await userInfoResponse.text());
      return res.redirect("/");
    }

    const userInfo = await userInfoResponse.json();

    req.session.user = {
      ...userInfo,
      accessToken: tokens.access_token,
      idToken: tokens.id_token,
      refreshToken: tokens.refresh_token,
    };

    res.redirect("/profile");
  } catch (error) {
    console.error("Authentication error:", error);
    res.redirect("/");
  }
});

app.get("/profile", checkAuth, (req, res) => {
  res.render("profile", {
    user: req.session.user,
    appName: APP_NAME,
    appColor: APP_COLOR,
  });
});

app.get("/logout", (req, res) => {
  const idToken = req.session.user?.idToken;
  const refreshToken = req.session.user?.refreshToken;

  // アプリケーションセッションを破棄
  req.session.destroy((err) => {
    if (err) {
      console.error("Session destroy error:", err);
    }

    if (idToken) {
      // Keycloakからもログアウト（RP-Initiated Logout）
      const browserKeycloakUrl = "http://localhost:8080";
      const logoutUrl = `${browserKeycloakUrl}/realms/${keycloakConfig.realm}/protocol/openid-connect/logout`;
      const postLogoutRedirectUri = encodeURIComponent(process.env.APP_URL || "http://localhost:3000");

      // id_token_hintとpost_logout_redirect_uriを含める
      const fullLogoutUrl = `${logoutUrl}?id_token_hint=${idToken}&post_logout_redirect_uri=${postLogoutRedirectUri}`;

      res.redirect(fullLogoutUrl);
    } else {
      res.redirect("/");
    }
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log("Keycloak configuration:", {
    realm: keycloakConfig.realm,
    authServerUrl: keycloakConfig["auth-server-url"],
    clientId: keycloakConfig.resource,
  });
});
