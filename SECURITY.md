# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.1.x   | ✅        |

## Reporting a Vulnerability

**Please do NOT open a public GitHub issue for security vulnerabilities.**

Report security issues by email to **security@peerads.io**. Include:

- A description of the vulnerability
- Steps to reproduce
- Potential impact
- Any suggested mitigations (optional)

You should receive an acknowledgement within **48 hours**. We aim to release a patch within **14 days** of confirmation. We will credit you in the release notes unless you prefer to remain anonymous.

## Scope

**In scope:**

- Authentication / authorisation flaws in the SDK
- Insecure transmission of API keys or user data
- SDK code that could be exploited to compromise the host application
- Dependency vulnerabilities with a known exploit

**Out of scope:**

- Issues in third-party ad-network SDKs (AdMob, Meta, AppLovin, etc.) — report those to the respective vendor
- Theoretical vulnerabilities without a proof of concept
- Social engineering attacks
