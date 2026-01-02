import RE2 from "re2"
import { describe, expect, it } from "vitest"
import config from "./default.json" with { type: "json" }

type CustomManager = (typeof config.customManagers)[number]

// Helper to test regex patterns using RE2 (same engine as Renovate)
function testPattern(pattern: string, input: string): RegExpExecArray | null {
  const regex = new RE2(pattern)
  return regex.exec(input)
}

function findManager(descriptionIncludes: string): CustomManager {
  const manager = config.customManagers.find(m => {
    let description = m.description
    if (Array.isArray(description)) {
      // support multiline descriptions
      description = description.join(" ")
    }
    return description.includes(descriptionIncludes)
  })
  if (!manager) {
    throw new Error(`Manager not found: ${descriptionIncludes}`)
  }
  return manager
}

function getPattern(manager: CustomManager, index: number): string {
  const pattern = manager.matchStrings[index]
  if (!pattern) {
    throw new Error(`Pattern not found at index ${index}`)
  }
  return pattern
}

describe("github-releases custom manager", () => {
  const manager = findManager("github-releases")

  describe("yml files", () => {
    const pattern = getPattern(manager, 0)

    it("matches github-releases comment in workflow file", () => {
      const input = `      - uses: NTBBloodbath/selene-action@23ef05dd5c4d687f4d3c939f76a1c342baf454aa # v1.0.0
        with:
          token: \${{ secrets.GITHUB_TOKEN }}
          args: --display-style=quiet ./lua/ ./spec/
          # renovate: datasource=github-releases depName=Kampfkarren/selene
          version: 0.29.0`

      const match = testPattern(pattern, input)
      expect(match).not.toBeNull()
      expect(match?.groups?.["depName"]).toBe("Kampfkarren/selene")
      expect(match?.groups?.["currentValue"]).toBe("0.29.0")
    })

    it("does not match unrelated content", () => {
      const input = `name: Test
on: push
jobs:
  test:
    runs-on: ubuntu-latest`

      const match = testPattern(pattern, input)
      expect(match).toBeNull()
    })
  })

  describe("lua files", () => {
    const pattern = getPattern(manager, 1)

    it("matches github-releases comment in lua file", () => {
      const input = `  -- renovate: datasource=github-releases depName=folke/lazy.nvim
  version = "11.14.1"`

      const match = testPattern(pattern, input)
      expect(match).not.toBeNull()
      expect(match?.groups?.["depName"]).toBe("folke/lazy.nvim")
      expect(match?.groups?.["currentValue"]).toBe("11.14.1")
    })

    it("matches without quotes around version", () => {
      const input = `  -- renovate: datasource=github-releases depName=neovim/neovim
  version = v0.10.0`

      const match = testPattern(pattern, input)
      expect(match).not.toBeNull()
      expect(match?.groups?.["depName"]).toBe("neovim/neovim")
      expect(match?.groups?.["currentValue"]).toBe("v0.10.0")
    })
  })
})

describe("git-refs (main branch) custom manager", () => {
  const manager = findManager("git-refs on main")

  describe("yml files", () => {
    const pattern = getPattern(manager, 0)

    it("matches git-refs comment in workflow file", () => {
      const input = `      # renovate: datasource=git-refs packageName=https://github.com/folke/lazy.nvim
      commit: abc123def456`

      const match = testPattern(pattern, input)
      expect(match).not.toBeNull()
      expect(match?.groups?.["packageName"]).toBe("https://github.com/folke/lazy.nvim")
      expect(match?.groups?.["currentDigest"]).toBe("abc123def456")
    })
  })

  describe("lua files", () => {
    const pattern = getPattern(manager, 1)

    it("matches git-refs comment in lua file", () => {
      const input = `  -- renovate: datasource=git-refs packageName=https://github.com/MagicDuck/grug-far.nvim
  commit = "abc123def456"`

      const match = testPattern(pattern, input)
      expect(match).not.toBeNull()
      expect(match?.groups?.["packageName"]).toBe("https://github.com/MagicDuck/grug-far.nvim")
      expect(match?.groups?.["currentDigest"]).toBe("abc123def456")
    })

    it("matches without quotes around commit", () => {
      const input = `  -- renovate: datasource=git-refs packageName=https://github.com/some/repo
  commit = abc123`

      const match = testPattern(pattern, input)
      expect(match).not.toBeNull()
      expect(match?.groups?.["packageName"]).toBe("https://github.com/some/repo")
      expect(match?.groups?.["currentDigest"]).toBe("abc123")
    })
  })
})

describe("git-refs-master (master branch) custom manager", () => {
  const manager = findManager("git-refs on master")

  describe("yml files", () => {
    const pattern = getPattern(manager, 0)

    it("matches git-refs-master comment in workflow file", () => {
      const input = `      # renovate: datasource=git-refs-master packageName=https://github.com/some/legacy-repo
      commit: def789`

      const match = testPattern(pattern, input)
      expect(match).not.toBeNull()
      expect(match?.groups?.["packageName"]).toBe("https://github.com/some/legacy-repo")
      expect(match?.groups?.["currentDigest"]).toBe("def789")
    })
  })

  describe("lua files", () => {
    const pattern = getPattern(manager, 1)

    it("matches git-refs-master comment in lua file", () => {
      const input = `  -- renovate: datasource=git-refs-master packageName=https://github.com/old/plugin
  commit = "xyz789"`

      const match = testPattern(pattern, input)
      expect(match).not.toBeNull()
      expect(match?.groups?.["packageName"]).toBe("https://github.com/old/plugin")
      expect(match?.groups?.["currentDigest"]).toBe("xyz789")
    })
  })
})

describe("npm packages in workflow env vars custom manager", () => {
  const manager = findManager("npm packages in GitHub Action")
  const pattern = getPattern(manager, 0)

  it("matches semantic-release version in env var", () => {
    const input = `      env:
        GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
        NPM_TOKEN: \${{ secrets.NPM_TOKEN }}
        # renovate: datasource=npm depName=semantic-release
        SEMANTIC_RELEASE_VERSION: 25.0.2`

    const match = testPattern(pattern, input)
    expect(match).not.toBeNull()
    expect(match?.groups?.["depName"]).toBe("semantic-release")
    expect(match?.groups?.["currentValue"]).toBe("25.0.2")
  })

  it("matches any npm package in env var", () => {
    const input = `      # renovate: datasource=npm depName=@semantic-release/changelog
        CHANGELOG_VERSION: 6.0.3`

    const match = testPattern(pattern, input)
    expect(match).not.toBeNull()
    expect(match?.groups?.["depName"]).toBe("@semantic-release/changelog")
    expect(match?.groups?.["currentValue"]).toBe("6.0.3")
  })

  it("does not match without renovate comment", () => {
    const input = `      env:
        SOME_VERSION: 1.2.3`

    const match = testPattern(pattern, input)
    expect(match).toBeNull()
  })
})
