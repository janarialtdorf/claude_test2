import { describe, expect, it } from "vitest";
import { getClientIp, minutesToWait, visitorRateLimitKey } from "@/lib/rate-limit";

describe("getClientIp", () => {
  it.each([
    ["203.0.113.7", "203.0.113.7"],
    ["203.0.113.7, 10.0.0.1, 10.0.0.2", "203.0.113.7"],
    ["  198.51.100.4  ", "198.51.100.4"],
    ["2001:db8::1", "2001:db8::1"],
    ["::1", "::1"],
  ])("reads %s as %s", (header, expected) => {
    expect(getClientIp(header)).toBe(expected);
  });

  it.each([null, "", "not-an-ip", "999.1.1.1", "<script>", ", 203.0.113.7"])(
    "falls back to 'unknown' for %s",
    (header) => {
      expect(getClientIp(header)).toBe("unknown");
    },
  );
});

describe("visitorRateLimitKey", () => {
  const secret = "test-secret";

  it("gives the same key for the same IP", () => {
    expect(visitorRateLimitKey("203.0.113.7", secret)).toBe(
      visitorRateLimitKey("203.0.113.7", secret),
    );
  });

  it("gives different keys for different IPs", () => {
    expect(visitorRateLimitKey("203.0.113.7", secret)).not.toBe(
      visitorRateLimitKey("203.0.113.8", secret),
    );
  });

  it("depends on the secret", () => {
    expect(visitorRateLimitKey("203.0.113.7", secret)).not.toBe(
      visitorRateLimitKey("203.0.113.7", "another-secret"),
    );
  });

  it("does not contain the IP address", () => {
    const key = visitorRateLimitKey("203.0.113.7", secret);
    expect(key).not.toContain("203.0.113.7");
    expect(key).toMatch(/^checkout:ip:[A-Za-z0-9_-]{43}$/);
  });
});

describe("minutesToWait", () => {
  it.each([
    [1, 1],
    [59, 1],
    [60, 1],
    [61, 2],
    [204, 4],
    [600, 10],
    [0, 1],
  ])("%s seconds → %s minutes", (seconds, minutes) => {
    expect(minutesToWait(seconds)).toBe(minutes);
  });
});
