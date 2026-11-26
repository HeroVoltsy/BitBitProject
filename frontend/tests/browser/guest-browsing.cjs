const { chromium, request } = require(
  process.env.PLAYWRIGHT_MODULE || "playwright",
);
const assert = require("node:assert/strict");
const path = require("node:path");
const os = require("node:os");
const api = "http://127.0.0.1:8002";
const site = "http://127.0.0.1:5176";

(async () => {
  const browser = await chromium.launch({
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
  });
  const req = await request.newContext({ baseURL: api });
  const proxy = await request.newContext({ baseURL: site });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  const calls = [],
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => {
    const url = new URL(r.url());
    if (url.pathname.startsWith("/backend"))
      calls.push({
        method: r.method(),
        path: url.pathname,
        authorization: r.headers().authorization,
      });
  });
  try {
    const password = "LocalBrowserOnly_12345";
    const login = await req.post("/auth/login", {
      data: {
        email: "existing-api-admin@example.com",
        password,
      },
    });
    assert.equal(login.status(), 200);
    const admin = {
      Authorization: "Bearer " + (await login.json()).access_token,
    };
    // Refuse all writes unless this is the disposable local test API.
    assert.equal(
      (await proxy.get("/backend/users/me", { headers: admin })).status(),
      200,
    );
    const tag = "existing_api_" + Date.now();
    const email = tag + "_guest@example.com";
    assert.equal(
      (
        await req.post("/auth/register", {
          data: {
            email,
            username: tag + "_guest",
            password,
          },
        })
      ).status(),
      201,
    );
    const starts = new Date(Date.now() + 86400000);
    const title = "Guest concert " + tag;
    const event = await (
      await req.post("/api/v1/events", {
        headers: admin,
        data: {
          title,
          category: "Music",
          location: "Guest Test Hall",
          starts_at: starts.toISOString(),
          description: "Published community event",
          latitude: 13.6218,
          longitude: 123.1948,
        },
      })
    ).json();
    const cancelled = await (
      await req.post("/api/v1/events", {
        headers: admin,
        data: {
          title: "Cancelled " + tag,
          category: "Sports",
          location: "Guest Test Hall",
          starts_at: starts.toISOString(),
        },
      })
    ).json();
    assert.equal(
      (
        await req.delete("/api/v1/events/" + cancelled.id, { headers: admin })
      ).status(),
      200,
    );

    await page.goto(site);
    await page
      .getByRole("button", { name: "Open " + title, exact: true })
      .waitFor();
    assert.equal(
      await page.getByText("Log in to browse events.", { exact: true }).count(),
      0,
    );
    assert.equal(
      await page
        .getByRole("button", { name: "Open Cancelled " + tag, exact: true })
        .count(),
      0,
    );
    await page
      .getByRole("textbox", { name: "Search events near you", exact: true })
      .fill("no matching event");
    assert.equal(
      await page
        .getByRole("button", { name: "Open " + title, exact: true })
        .count(),
      0,
    );
    await page
      .getByRole("textbox", { name: "Search events near you", exact: true })
      .fill("Guest concert");
    await page
      .getByRole("button", { name: "Open " + title, exact: true })
      .click();
    await page.getByRole("heading", { name: title, exact: true }).waitFor();
    await page.getByRole("button", { name: "Back to events", exact: true }).click();

    await page
      .getByRole("button", { name: "Schedule", exact: true })
      .first()
      .click();
    await page
      .getByRole("combobox", { name: "Year", exact: true })
      .selectOption(String(starts.getFullYear()));
    await page
      .getByRole("combobox", { name: "Month", exact: true })
      .selectOption(String(starts.getMonth()));
    await page
      .locator(".cal-cell")
      .filter({ hasText: new RegExp("^" + starts.getDate() + "$") })
      .click();
    await page.locator(".cal-event").filter({ hasText: title }).click();
    await page.getByRole("heading", { name: title, exact: true }).waitFor();
    await page
      .getByRole("button", { name: "Explore", exact: true })
      .first()
      .click();
    await page
      .getByRole("textbox", { name: "Search a location or event", exact: true })
      .fill("Guest Test Hall");
    await page.getByRole("button", { name: title, exact: true }).click();
    await page.getByRole("heading", { name: title, exact: true }).waitFor();
    await page
      .getByRole("button", { name: "Home", exact: true })
      .first()
      .click();
    assert.ok(calls.length > 0);
    assert.ok(
      calls.every(
        (c) =>
          c.method === "GET" &&
          c.path === "/backend/api/v1/events" &&
          !c.authorization,
      ),
    );
    console.log(
      "PASS: guests browse real published events, search, Schedule, Explore, and details without private requests or tokens.",
    );

    await page
      .getByRole("button", { name: "Like " + title, exact: true })
      .click();
    await page.getByRole("dialog").waitFor();
    assert.ok(calls.every((c) => c.method === "GET"));
    await page.getByRole("button", { name: "Close", exact: true }).click();
    await page
      .getByRole("button", { name: "Join " + title, exact: true })
      .click();
    await page.getByRole("dialog").waitFor();
    assert.ok(calls.every((c) => c.method === "GET"));
    await page.getByRole("textbox", { name: "Email", exact: true }).fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    const joined = page.waitForResponse(
      (r) =>
        new URL(r.url()).pathname ===
          "/backend/api/v1/events/" + event.id + "/registrations" &&
        r.request().method() === "POST",
    );
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Log In", exact: true })
      .last()
      .click();
    assert.equal((await joined).status(), 201);
    await page
      .getByRole("button", {
        name: "You're going to " + title + ". Open event",
        exact: true,
      })
      .waitFor();
    await page.reload();
    await page
      .getByRole("button", {
        name: "You're going to " + title + ". Open event",
        exact: true,
      })
      .waitFor();
    console.log(
      "PASS: liking and joining ask for login; pending join completes after real login and survives refresh.",
    );

    await page
      .getByRole("button", { name: "Your profile", exact: true })
      .click();
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    const marker = calls.length;
    await page.getByRole("button", { name: /log out/i }).click();
    await page
      .getByRole("button", { name: "Join " + title, exact: true })
      .waitFor();
    assert.equal(
      await page.evaluate(() =>
        sessionStorage.getItem("salika.access-token.v2"),
      ),
      null,
    );
    assert.ok(
      calls
        .slice(marker)
        .every(
          (c) =>
            c.method === "GET" &&
            c.path === "/backend/api/v1/events" &&
            !c.authorization,
        ),
    );
    await page.screenshot({
      path: path.join(os.tmpdir(), "bitbit-guest-browsing-desktop.png"),
      fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();
    await page
      .getByRole("button", { name: "Open " + title, exact: true })
      .waitFor();
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    );
    await page.screenshot({
      path: path.join(os.tmpdir(), "bitbit-guest-browsing-mobile.png"),
      fullPage: true,
    });
    assert.deepEqual(errors, []);
    console.log(
      "PASS: logout restores public browsing without registration state; mobile fits the screen; no browser errors.",
    );
  } catch (e) {
    console.error(e);
    await page
      .screenshot({
        path: path.join(os.tmpdir(), "bitbit-guest-browsing-failure.png"),
        fullPage: true,
      })
      .catch(() => {});
    process.exitCode = 1;
  } finally {
    await req.dispose();
    await proxy.dispose();
    await browser.close();
  }
})();
